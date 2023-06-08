import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleProp,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
  ViewStyle,
  View,
  ViewProps,
  FlatListProps,
  FlatList,
} from 'react-native';
import styles from './WheelPicker.styles';
import WheelPickerItem from './WheelPickerItem';

interface Props {
  selectedIndex: number;
  options: any[];
  onChange: (index: number) => void;
  renderItem: (option: any, index: number) => React.ReactElement | null;
  selectedIndicatorStyle?: StyleProp<ViewStyle>;
  itemStyle?: ViewStyle;
  itemHeight?: number;
  containerStyle?: ViewStyle;
  containerProps?: Omit<ViewProps, 'style'>;
  scaleFunction?: (x: number) => number;
  rotationFunction?: (x: number) => number;
  opacityFunction?: (x: number) => number;
  visibleRest?: number;
  decelerationRate?: 'normal' | 'fast' | number;
  flatListProps?: Omit<FlatListProps<string | null>, 'data' | 'renderItem'>;
}

const WheelPicker: React.FC<Props> = ({
  selectedIndex,
  options,
  onChange,
  renderItem,
  selectedIndicatorStyle = {},
  containerStyle = {},
  itemStyle = {},
  itemHeight = 40,
  scaleFunction = (x: number) => 1.0 ** x,
  rotationFunction = (x: number) => 1 - Math.pow(1 / 2, x),
  opacityFunction = (x: number) => Math.pow(1 / 3, x),
  visibleRest = 2,
  decelerationRate = 'fast',
  containerProps = {},
  flatListProps = {},
}) => {
  const flatListRef = useRef<FlatList>(null);
  const [scrollY] = useState(new Animated.Value(0));

  const containerHeight = (1 + visibleRest * 2) * itemHeight;
  const paddedOptions = useMemo(() => {
    const array: (any | null)[] = [...options];
    for (let i = 0; i < visibleRest; i++) {
      array.unshift(null);
      array.push(null);
    }
    return array;
  }, [options, visibleRest]);

  const offsets = useMemo(
    () => [...Array(paddedOptions.length)].map((x, i) => i * itemHeight),
    [paddedOptions, itemHeight],
  );

  const currentScrollIndex = useMemo(
    () => Animated.add(Animated.divide(scrollY, itemHeight), visibleRest),
    [visibleRest, scrollY, itemHeight],
  );

  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    // Due to list bounciness when scrolling to the start or the end of the list
    // the offset might be negative or over the last item.
    // We therefore clamp the offset to the supported range.
    const offsetY = Math.min(
      itemHeight * (options.length - 1),
      Math.max(event.nativeEvent.contentOffset.y, 0),
    );

    let index = Math.floor(Math.floor(offsetY) / itemHeight);
    const last = Math.floor(offsetY % itemHeight);
    if (last > itemHeight / 2) index++;

    if (index !== selectedIndex) {
      onChange(index);
    }
  };

  useEffect(() => {
    if (selectedIndex < 0 || selectedIndex >= options.length) {
      throw new Error(
        `Selected index ${selectedIndex} is out of bounds [0, ${
          options.length - 1
        }]`,
      );
    }
  }, [selectedIndex, options]);

  return (
    <View
      style={[styles.container, { height: containerHeight }, containerStyle]}
      {...containerProps}
    >
      <View
        style={[
          styles.selectedIndicator,
          selectedIndicatorStyle,
          {
            transform: [{ translateY: -itemHeight / 2 }],
            height: itemHeight,
          },
        ]}
      />
      <Animated.FlatList<string | null>
        {...flatListProps}
        ref={flatListRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        snapToOffsets={offsets}
        decelerationRate={decelerationRate}
        onLayout={() => {
          flatListRef.current?.scrollToIndex({
            index: selectedIndex,
            animated: false,
          });
        }}
        getItemLayout={(data, index) => ({
          length: itemHeight,
          offset: itemHeight * index,
          index,
        })}
        data={paddedOptions}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item: option, index }) => (
          <WheelPickerItem
            key={`option-${index}`}
            index={index}
            style={itemStyle}
            height={itemHeight}
            currentScrollIndex={currentScrollIndex}
            scaleFunction={scaleFunction}
            rotationFunction={rotationFunction}
            opacityFunction={opacityFunction}
            visibleRest={visibleRest}
          >
            {renderItem(option, index)}
          </WheelPickerItem>
        )}
      />
    </View>
  );
};

export default WheelPicker;
