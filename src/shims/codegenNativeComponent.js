// Renvoie un composant web neutre
export default function codegenNativeComponent() {
  return (props) => {
    const { children, ...rest } = props || {};
    return <div {...rest}>{children}</div>;
  };
}
