import { VNode, Slot } from "vue";
import { PluginDef } from "@fullcalendar/core";
export declare function wrapVDomGenerator(vDomGenerator: Slot): (props: any) => {
    vue: VNode<import("vue").RendererNode, import("vue").RendererElement, {
        [key: string]: any;
    }>[];
};
export declare function createVueContentTypePlugin(instance: any): PluginDef;
