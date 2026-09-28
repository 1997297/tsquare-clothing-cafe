import { notFound } from "next/navigation";
import { STYLES } from "@/data/styles";
import { getCatalogueSnapshot } from "@/lib/catalogue-server";
import { getRelatedStyles } from "@/lib/catalogue";
import StyleDetailClient from "./StyleDetailClient";

interface StylePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return STYLES.map((s) => ({
    slug: s.slug,
  }));
}

export async function generateMetadata({ params }: StylePageProps) {
  const { slug } = await params;
  const { styles } = await getCatalogueSnapshot();
  const style = styles.find((candidate) => candidate.slug === slug);
  if (!style) return { title: "Style Not Found" };

  return {
    title: `${style.code}: ${style.name} | TSquare Clothing Cafe`,
    description: style.description,
    openGraph: {
      title: `${style.code}: ${style.name}`,
      description: style.description,
      images: [
        {
          url: style.images[0],
          width: 1200,
          height: 1600,
          alt: style.name,
        },
      ],
    },
  };
}

export default async function StyleDetailPage({ params }: StylePageProps) {
  const { slug } = await params;
  const { styles } = await getCatalogueSnapshot();
  const style = styles.find((candidate) => candidate.slug === slug);

  if (!style) {
    notFound();
  }

  const relatedStyles = getRelatedStyles(styles, style, 3);

  return <StyleDetailClient style={style} relatedStyles={relatedStyles} />;
}
