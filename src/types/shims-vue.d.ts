declare module "*.vue" {
  import { DefineComponent } from "vue";
  const component: DefineComponent<
    Record<string, unknown>, // props
    Record<string, unknown>, // raw bindings
    unknown // data / state
  >;
  export default component;
}
