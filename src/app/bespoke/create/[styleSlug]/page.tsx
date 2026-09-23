import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStyleBySlug } from "@/data/styles";
import { BespokeConfigurator } from "./BespokeConfigurator";

interface Props {
  params: Promise<{ styleSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { styleSlug } = await params;

  if (styleSlug === "idea") {
    return {
      title: "Start From An Idea | TSquare Clothing Cafe",
      description:
        "Commission a fully bespoke garment from your own vision. Choose your garment type, fabric, colour, and measurements.",
    };
  }

  const style = getStyleBySlug(styleSlug);
  if (!style) return { title: "Style Not Found" };

  return {
    title: `Make This Mine: ${style.code} | TSquare Clothing Cafe`,
    description: `Commission your own ${style.name}. Choose fabric, colour, fit, and measurements for a fully bespoke garment.`,
  };
}

export default async function BespokeCreatePage({ params }: Props) {
  const { styleSlug } = await params;
  const isIdeaPath = styleSlug === "idea";

  let style = null;
  if (!isIdeaPath) {
    style = getStyleBySlug(styleSlug);
    if (!style) notFound();
  }

  return <BespokeConfigurator styleSlug={styleSlug} style={style} isIdeaPath={isIdeaPath} />;
}
