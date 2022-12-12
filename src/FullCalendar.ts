import { PropType, defineComponent, h, Teleport, VNode } from "vue";
import { Calendar, CalendarOptions } from "@fullcalendar/core";
import { OPTION_IS_COMPLEX } from "./options";
import { shallowCopy } from "./utils";
import { createVueContentTypePlugin } from "./custom-content-type";

const FullCalendar = defineComponent({
    props: {
        options: {
            type: Object as PropType<CalendarOptions>,
            default() {
                return {};
            },
        },
    },

    data: initData,

    mounted() {
        // store internal data (slotOptions, calendar)
        // https://github.com/vuejs/vue/issues/1988#issuecomment-163013818
        // console.log(this.$slots);
        const calendarOptions = this.buildOptions(this.options, this.$);
        const calendar = new Calendar(this.$el as HTMLElement, calendarOptions);
        (this as any).calendar = calendar;
        calendar.render();
    },

    beforeUpdate() {
        this.getApi().resumeRendering(); // the watcher handlers paused it
    },

    beforeUnmount() {
        this.getApi().destroy();
    },

    methods: {
        // separate funcs b/c of type inferencing
        getApi,
        buildOptions,
    }, // separate func b/c of type inferencing

    render() {
        const slots: VNode[] = [];
        Object.keys(this.slots).forEach((slotKey: string) => {
            const slot = this.slots[slotKey];
            slot.forEach(({ s, d }) => {
                if (
                    slotKey &&
                    typeof this.$slots == "object" &&
                    this.$slots[slotKey] &&
                    typeof this.$slots[slotKey] == "function"
                ) {
                    const slotFn = this.$slots[slotKey];
                    if (slotFn) {
                        const slotElement = slotFn(d);
                        slots.push(
                            h(
                                Teleport,
                                {
                                    to: s,
                                },
                                slotElement
                            )
                        );
                    }
                }
            });
        });
        return h(
            "div",
            {
                // when renderId is changed, Vue will trigger a real-DOM async rerender, calling beforeUpdate/updated
                attrs: { "data-fc-render-id": this.renderId },
            },
            slots
        );
    },

    watch: buildWatchers(),
});

export default FullCalendar;

function initData(): {
    renderId: number;
    slots: { [key: string]: { s: Element; d: any }[] };
} {
    return {
        renderId: 0,
        slots: {},
    };
}

function buildOptions(
    this: any,
    suppliedOptions: CalendarOptions,
    instance: any
): CalendarOptions {
    const slots: { [key: string]: Function } = {};
    Object.keys(this.$slots).forEach((slotKey) => {
        slots[slotKey] = (data: any) => {
            const inner = document.createElement("div");
            if (!this.slots[slotKey]) this.slots[slotKey] = [];
            this.slots[slotKey].push({
                s: inner,
                d: data,
            });
            return { domNodes: [inner] };
        };
    });
    return {
        ...slots,
        ...suppliedOptions, // spread will pull out the values from the options getter functions
        plugins: (suppliedOptions.plugins || []).concat([
            createVueContentTypePlugin(instance),
        ]),
    };
}

function getApi(this: any) {
    return this.calendar;
}

type FullCalendarInstance = InstanceType<typeof FullCalendar>;

function buildWatchers() {
    const watchers: { [member: string]: any } = {
        // watches changes of ALL options and their nested objects,
        // but this is only a means to be notified of top-level non-complex options changes.
        options: {
            deep: true,
            handler(this: FullCalendarInstance, options: CalendarOptions) {
                const calendar = this.getApi();
                calendar.pauseRendering();

                const calendarOptions = this.buildOptions(options, this.$);
                calendar.resetOptions(calendarOptions);

                this.renderId++; // will queue a rerender
            },
        },
    };

    for (const complexOptionName in OPTION_IS_COMPLEX) {
        // handlers called when nested objects change
        watchers[`options.${complexOptionName}`] = {
            deep: true,
            handler(this: FullCalendarInstance, val: any) {
                // unfortunately the handler is called with undefined if new props were set, but the complex one wasn't ever set
                if (val !== undefined) {
                    const calendar = this.getApi();
                    calendar.pauseRendering();
                    calendar.resetOptions(
                        {
                            // the only reason we shallow-copy is to trick FC into knowing there's a nested change.
                            // TODO: future versions of FC will more gracefully handle event option-changes that are same-reference.
                            [complexOptionName]: shallowCopy(val),
                        },
                        true
                    );

                    this.renderId++; // will queue a rerender
                }
            },
        };
    }

    return watchers;
}
