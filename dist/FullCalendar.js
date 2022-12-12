import "@fullcalendar/core/vdom";
import { defineComponent, h, Teleport } from "vue";
import { Calendar } from "@fullcalendar/core";
import { OPTION_IS_COMPLEX } from "./options";
import { shallowCopy } from "./utils";
import { createVueContentTypePlugin } from "./custom-content-type";
const FullCalendar = defineComponent({
    props: {
        options: {
            type: Object,
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
        const calendar = new Calendar(this.$el, calendarOptions);
        this.calendar = calendar;
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
    },
    render() {
        const slots = [];
        Object.keys(this.slots).forEach((slotKey) => {
            const slot = this.slots[slotKey];
            slot.forEach(({ s, d }) => {
                if (slotKey &&
                    typeof this.$slots == "object" &&
                    this.$slots[slotKey] &&
                    typeof this.$slots[slotKey] == "function") {
                    const slotFn = this.$slots[slotKey];
                    if (slotFn) {
                        const slotElement = slotFn(d);
                        slots.push(h(Teleport, {
                            to: s,
                        }, slotElement));
                    }
                }
            });
        });
        return h("div", {
            // when renderId is changed, Vue will trigger a real-DOM async rerender, calling beforeUpdate/updated
            attrs: { "data-fc-render-id": this.renderId },
        }, slots);
    },
    watch: buildWatchers(),
});
export default FullCalendar;
function initData() {
    return {
        renderId: 0,
        slots: {},
    };
}
function buildOptions(suppliedOptions, instance) {
    const slots = {};
    Object.keys(this.$slots).forEach((slotKey) => {
        slots[slotKey] = (data) => {
            const inner = document.createElement("div");
            if (!this.slots[slotKey])
                this.slots[slotKey] = [];
            this.slots[slotKey].push({
                s: inner,
                d: data,
            });
            return { domNodes: [inner] };
        };
    });
    return {
        ...slots,
        ...suppliedOptions,
        plugins: (suppliedOptions.plugins || []).concat([
            createVueContentTypePlugin(instance),
        ]),
    };
}
function getApi() {
    return this.calendar;
}
function buildWatchers() {
    const watchers = {
        // watches changes of ALL options and their nested objects,
        // but this is only a means to be notified of top-level non-complex options changes.
        options: {
            deep: true,
            handler(options) {
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
            handler(val) {
                // unfortunately the handler is called with undefined if new props were set, but the complex one wasn't ever set
                if (val !== undefined) {
                    const calendar = this.getApi();
                    calendar.pauseRendering();
                    calendar.resetOptions({
                        // the only reason we shallow-copy is to trick FC into knowing there's a nested change.
                        // TODO: future versions of FC will more gracefully handle event option-changes that are same-reference.
                        [complexOptionName]: shallowCopy(val),
                    }, true);
                    this.renderId++; // will queue a rerender
                }
            },
        };
    }
    return watchers;
}
//# sourceMappingURL=FullCalendar.js.map