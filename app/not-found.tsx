import { StateBlock } from "@/components/common/StateBlock";

export default function NotFound() {
  return (
    <StateBlock
      eyebrow="(404)"
      title="Page Not Found"
      message="The page you are looking for does not exist or has moved out of the current drop."
      actionHref="/products"
      actionLabel="Shop All"
      secondaryActionHref="/"
      secondaryActionLabel="Home"
    />
  );
}
