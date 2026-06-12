import React from 'react';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const AD_UNIT_ID = __DEV__ ? TestIds.BANNER : 'ca-app-pub-5150043080807634/4264315698';

export default function AdBanner() {
  return (
    <BannerAd
      unitId={AD_UNIT_ID}
      size={BannerAdSize.BANNER}
      requestOptions={{
        requestNonPersonalizedAdsOnly: false,
      }}
    />
  );
}
