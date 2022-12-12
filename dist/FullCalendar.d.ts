import "@fullcalendar/core/vdom";
import { PropType } from "vue";
import { CalendarOptions } from "@fullcalendar/core";
declare const FullCalendar: import("vue").DefineComponent<{
    options: {
        type: PropType<CalendarOptions>;
        default(): {};
    };
}, unknown, {
    renderId: number;
    slots: {
        [key: string]: {
            s: Element;
            d: any;
        }[];
    };
}, {}, {
    getApi: typeof getApi;
    buildOptions: typeof buildOptions;
}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").VNodeProps & import("vue").AllowedComponentProps & import("vue").ComponentCustomProps, Readonly<import("vue").ExtractPropTypes<{
    options: {
        type: PropType<CalendarOptions>;
        default(): {};
    };
}>>, {
    options: CalendarOptions;
}>;
export default FullCalendar;
declare function buildOptions(this: any, suppliedOptions: CalendarOptions, instance: any): CalendarOptions;
declare function getApi(this: any): any;
