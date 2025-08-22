"use client";
import { Builder } from '@builder.io/react';

import { FlyerBanner } from '../components/customComponent/FlyerBanner';
import { HeroBanner } from '../components/customComponent/Herobanner';
import { PromoGrid } from '../components/customComponent/PromoGrid';
import { PromotionalBanner } from '../components/customComponent/PromotionalBanner';

const BuilderComponents = () => {
  Builder.registerComponent(HeroBanner, {
    name: "Hero Banner",
    inputs: [
        { name: "title", type: "string", required: true, defaultValue: "Welcome to Our Site" },
        { name: "subtitle", type: "string", defaultValue: "This is a short description" },
        { name: "ctaText", type: "string", defaultValue: "Get Started" },
        { name: "ctaLink", type: "url", defaultValue: "/" },
        { name: "backgroundImage", type: "file", allowedFileTypes: ["jpeg", "jpg", "png", "webp"] },
    ],
  });
  Builder.registerComponent(PromotionalBanner, {
    name: "Promotional Left Banner",
    inputs: [
      { name: "mainImage", type: "file", allowedFileTypes: ["jpeg", "jpg", "png", "webp"], required: true },
      { name: "mainTitle", type: "string", defaultValue: "ONLINE CLEARANCE" },
      { name: "mainSubtitle", type: "string", defaultValue: "Save up to 60% on select items" },
      { name: "mainCtaText", type: "string", defaultValue: "Shop Now" },
      { name: "mainCtaLink", type: "url", defaultValue: "/" },
    ],
  });
  Builder.registerComponent(PromoGrid, {
  name: "Promo Grid Right Banner",
  inputs: [
    {
      name: "promoCards",
      type: "list",
      subFields: [
        { name: "title", type: "string", defaultValue: "SAVE UP TO 50%" },
        { name: "subtitle", type: "string", defaultValue: "Patio & Outdoor Furniture" },
        { name: "discount", type: "string", defaultValue: "50%" },
        { name: "image", type: "file", allowedFileTypes: ["jpeg", "jpg", "png", "webp"] },
        { name: "link", type: "url", defaultValue: "/" },
      ],
    },
  ],
  });
  Builder.registerComponent(FlyerBanner, {
    name: "Flyer Banner",
    inputs: [
      { name: "image", type: "file", allowedFileTypes: ["jpeg", "jpg", "png", "webp"], required: true },
      { name: "title", type: "string", defaultValue: "Catch This Week’s Flyer Deals" },
      { name: "subtitle", type: "string", defaultValue: "Save on tools, home essentials, and more!" },
      { name: "ctaText", type: "string", defaultValue: "Shop Now" },
      { name: "ctaLink", type: "url", defaultValue: "/" },
      { name: "backgroundColor", type: "color", defaultValue: "#d91c24" },
    ],
  });
}
export default BuilderComponents
