import React from 'react';

// Stub components
const Hero = (props: any) => <div><h1>{props.title || "Hero"}</h1></div>;
const ProductsGrid = (props: any) => <div><h2>Products: {props.collection || "featured"}</h2></div>;
const TextBlock = (props: any) => <div><p>{props.text || "Text content"}</p></div>;

export default function PageRenderer({ blocks }: { blocks: any[] }) {
    if (!blocks || !Array.isArray(blocks)) return null;

    return blocks.map((block, i) => {
        switch (block.type) {
            case "hero":
                return <Hero key={i} {...block} />

            case "products":
                return <ProductsGrid key={i} {...block} />

            case "text":
                return <TextBlock key={i} {...block} />

            default:
                return null
        }
    })
}
