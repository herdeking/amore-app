import React, { useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { SwipeCard } from './SwipeCard';
import { ActionButtons } from './ActionButtons';
import { useSwipe } from '../../hooks/useSwipe';
import { User } from '../../types';
import { Theme } from '../../constants/theme';

export const SwipeDeck: React.FC = () => {
  const { profiles, swipe } = useSwipe();
  const swiperRef = useRef<Swiper<User>>(null);

  const handleSwipe = (index: number, action: 'like' | 'pass' | 'superlike') => {
    const target = profiles[index];
    if (target) swipe(target.id, action);
  };

  return (
    <View style={styles.container}>
      <Swiper
        ref={swiperRef}
        cards={profiles}
        renderCard={card => <SwipeCard user={card} />}
        onSwipedRight={i => handleSwipe(i, 'like')}
        onSwipedLeft={i => handleSwipe(i, 'pass')}
        onSwipedTop={i => handleSwipe(i, 'superlike')}
        stackSize={3}
        stackSeparation={12}
        animateCardOpacity
        verticalSwipe
        backgroundColor="transparent"
        cardVerticalMargin={0}
        cardHorizontalMargin={16}
      />
      <ActionButtons
        onPass={() => swiperRef.current?.swipeLeft()}
        onLike={() => swiperRef.current?.swipeRight()}
        onSuperLike={() => swiperRef.current?.swipeTop()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
});
