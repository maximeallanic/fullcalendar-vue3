import { createApp, h, render as vueRender } from "vue";
import { createPlugin } from "@fullcalendar/core";
/*
wrap it in an object with a `vue` key, which the custom content-type handler system will look for
*/
export function wrapVDomGenerator(vDomGenerator) {
    return function (props) {
        return { vue: vDomGenerator(props) };
    };
}
export function createVueContentTypePlugin(instance) {
    return createPlugin({
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
            vueRender(vNode, el);
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
function initApp(initialContent, appContext) {
    // TODO: do something with appContext
    return createApp({
        data() {
            return {
                content: initialContent,
            };
        },
        render() {
            const { content } = this;
            // the slot result can be an array, but the returned value of a vue component's
            // render method must be a single node.
            if (content.length === 1) {
                return content[0];
            }
            else {
                return h("span", {}, content);
            }
        },
    });
}
//# sourceMappingURL=custom-content-type.js.map