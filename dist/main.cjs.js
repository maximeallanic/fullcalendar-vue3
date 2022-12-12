'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

require('@fullcalendar/core/vdom');
var vue = require('vue');
var core = require('@fullcalendar/core');

const OPTION_IS_COMPLEX = {
    headerToolbar: true,
    footerToolbar: true,
    events: true,
    eventSources: true,
    resources: true
};

// TODO: add types!
/*
works with objects and arrays
*/
function shallowCopy(val) {
    if (typeof val === "object") {
        if (Array.isArray(val)) {
            val = Array.prototype.slice.call(val);
        }
        else if (val) {
            // non-null
            val = { ...val };
        }
    }
    return val;
}

function createVueContentTypePlugin(instance) {
    return core.createPlugin({
        contentTypeHandlers: {
            vue: () => buildVDomHandler(instance), // looks for the `vue` key
        },
    });
}
function buildVDomHandler(instance) {
    function render(el, vDomContent) {
        vDomContent.forEach((vNode) => {
            vNode.appContext = instance.appContext;
            console.log(vNode, instance.appContext, vDomContent);
            vue.render(vNode, el);
            //vNode.component.parent = instance;
        });
        // console.log(vDomContent, instance);
        // if (!slotOptions) return;
        // const { slot } = slotOptions.find(({ key }) => key == vDomContent.key);
        // const [output] = slot(vDomContent.data);
        // output.appContext = appContext;
        // output.console.log(vDomContent, slotOptions, slot, output);
        //const innerEl = document.createElement("div");
        //const innerNode = h("div", { class: "fc-event-1" }, output);
        //innerNode.appContext = appContext;
        //vueRender(innerNode, output);
        // // the handler
        // if (currentEl !== el) {
        //     if (currentEl && app) {
        //         // if changing elements, recreate the vue
        //         app.unmount();
        //     }
        //     currentEl = el;
        // }
        // if (!app) {
        //     app = initApp(vDomContent, appContext);
        //     // vue's mount method *replaces* the given element. create an artificial inner el
        //     let innerEl = document.createElement("span");
        //     el.appendChild(innerEl);
        //     componentInstance = app.mount(innerEl) as RootComponentInstance;
        // } else {
        //     componentInstance.content = vDomContent;
        // }
    }
    function destroy() { }
    return { render, destroy };
}

const FullCalendar = vue.defineComponent({
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
        const calendar = new core.Calendar(this.$el, calendarOptions);
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
                        slots.push(vue.h(vue.Teleport, {
                            to: s,
                        }, slotElement));
                    }
                }
            });
        });
        return vue.h("div", {
            // when renderId is changed, Vue will trigger a real-DOM async rerender, calling beforeUpdate/updated
            attrs: { "data-fc-render-id": this.renderId },
        }, slots);
    },
    watch: buildWatchers(),
});
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

exports["default"] = FullCalendar;
Object.keys(core).forEach(function (k) {
    if (k !== 'default' && !exports.hasOwnProperty(k)) Object.defineProperty(exports, k, {
        enumerable: true,
        get: function () { return core[k]; }
    });
});
