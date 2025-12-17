// constants/storeStoryContentType.ts
export const StoreStoryContentType = {
  VideoOpener: 'VideoOpener',
  TextIntro: 'TextIntro',
  SingleImage: 'SingleImage',
  TextExpanded: 'TextExpanded',
  VideoProcess: 'VideoProcess',
  ImageGallery: 'ImageGallery',
  VideoTestimonial: 'VideoTestimonial',
  TextClosing: 'TextClosing'
} as const;

export type StoreStoryContentTypeValue =
  (typeof StoreStoryContentType)[keyof typeof StoreStoryContentType];

// Helper functions to check content type
export const isVideoContent = (contentType: string): boolean => {
  const videoTypes: string[] = [
    StoreStoryContentType.VideoOpener,
    StoreStoryContentType.VideoProcess,
    StoreStoryContentType.VideoTestimonial
  ];
  return videoTypes.includes(contentType);
};

export const isTextContent = (contentType: string): boolean => {
  const textTypes: string[] = [
    StoreStoryContentType.TextIntro,
    StoreStoryContentType.TextExpanded,
    StoreStoryContentType.TextClosing
  ];
  return textTypes.includes(contentType);
};

export const isImageContent = (contentType: string): boolean => {
  const imageTypes: string[] = [
    StoreStoryContentType.SingleImage,
    StoreStoryContentType.ImageGallery
  ];
  return imageTypes.includes(contentType);
};

