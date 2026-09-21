import type {MetadataRoute} from 'next';
import {SITE_URL} from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date('2026-09-21');
  return [
    {url: `${SITE_URL}/`, lastModified, changeFrequency: 'monthly', priority: 1},
    {url: `${SITE_URL}/confidentialite`, lastModified, changeFrequency: 'yearly', priority: 0.3},
    {url: `${SITE_URL}/cgu`, lastModified, changeFrequency: 'yearly', priority: 0.3}
  ];
}
