import * as d3Shape from 'd3-shape';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    Image,
    Pressable,
    StyleSheet,
    View
} from 'react-native';
import Svg, { G, Path, Text, Image as SVGImage } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';

const { width, height } = Dimensions.get('screen');

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

interface WheelOfFortuneProps {
  options: {
    rewards: string[];
    weights?: number[];
    imageSources?: string[];
    colors?: string[];
    textColor?: string;
    innerRadius?: number;
    textAngle?: 'vertical' | 'horizontal';
    duration?: number;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    knobSource?: any;
    knobSize?: number;
    onRef?: (ref: any) => void;
    getWinner?: (index: number) => void;
    winner?: number;
    playButton?: () => React.ReactNode;
  };
}

interface WheelPath {
  path: string | null;
  color: string;
  value: number;
  label: string;
  centroid: [number, number];
}

const LuckyWheelReanimated: React.FC<WheelOfFortuneProps> = ({ options }) => {
  const [enabled, setEnabled] = useState(false);
  const [started, setStarted] = useState(false);
  const [wheelPaths, setWheelPaths] = useState<WheelPath[]>([]);

  const angle = useSharedValue(0);
  const gameScreen = useSharedValue(width - 40);
  const wheelOpacity = useSharedValue(1);
  
  const oneTurn = 360;
  const angleBySegment = useRef<number>(0);
  const angleOffset = useRef<number>(0);

  const Rewards = options.rewards;
  const RewardCount = Rewards.length;

  const prepareWheel = useCallback(() => {
    angleBySegment.current = oneTurn / RewardCount;
    angleOffset.current = angleBySegment.current / 2;

    const colors = options.colors || [
      '#E07026',
      '#E8C22E',
      '#ABC937',
      '#4F991D',
      '#22AFD3',
      '#5858D0',
      '#7B48C8',
      '#D843B9',
      '#E23B80',
      '#D82B2B',
    ];

    const data = Array.from({ length: RewardCount }, (_, i) => 1); // Create an array of numbers [1, 2, 3, ...]
    const arcs = d3Shape.pie<number>().value((d) => d)(data);

    const newWheelPaths = arcs.map((arc, index) => {
      const instance = d3Shape
        .arc<d3Shape.PieArcDatum<number>>()
        .padAngle(0.01)
        .outerRadius(width / 2)
        .innerRadius(options.innerRadius || 100);

      return {
        path: instance(arc),
        color: colors[index % colors.length],
        value: index,
        label: Rewards[index],
        centroid: instance.centroid(arc) as [number, number],
      };
    });

    setWheelPaths(newWheelPaths);
  }, [Rewards, RewardCount, options]);

  useEffect(() => {
    options.onRef && options.onRef({ reset: resetWheel });
    prepareWheel();

    return () => {
      options.onRef && options.onRef(undefined);
    };
  }, [prepareWheel, options]);

  const resetWheel = () => {
    setEnabled(false);
    setStarted(false);
    // Animate back to 0 degrees
    angle.value = withTiming(0, { duration: 1000 }, () => {
      runOnJS(prepareWheel)(); // Prepare the wheel again after resetting
    });
  };


  const handlePress = () => {
    if (!enabled) {
      const duration = options.duration || 10000;
      setEnabled(true);
      setStarted(true);
      
      // Get weights and calculate the total weight
      const weights = options.weights || Array(RewardCount).fill(1);
      const totalWeight = weights.reduce((acc, weight) => acc + weight, 0);
      
      // Generate a random number based on the total weight
      const randomNum = Math.random() * totalWeight;
      let cumulativeWeight = 0;
      let winnerIndex = -1;

      // Determine the winner index based on weights
      for (let i = 0; i < RewardCount; i++) {
        cumulativeWeight += weights[i];
        if (randomNum <= cumulativeWeight) {
          winnerIndex = i;
          break;
        }
      }

      // Fallback if all weights are similar
      if (winnerIndex === -1) {
        winnerIndex = Math.floor(Math.random() * RewardCount);
      }

      angle.value = withTiming(
        (360 - winnerIndex * (oneTurn / RewardCount)) + (duration / 1000) * 360, // Adjusted calculation
        { duration: duration },
        () => {
          // Call options.getWinner safely
          if (options.getWinner) {
            runOnJS(options.getWinner)(winnerIndex); // Pass the winner index using runOnJS
          }
          // Reset enabled state after spin is finished
          runOnJS(setEnabled)(false); // Call setEnabled on the JS thread
        }
      );
    }
  };
  const _renderKnob = () => {
    const knobSize = options.knobSize || 30;
    return (
      <Image
        source={options.knobSource || require('../../assets/images/knob.png')}
        style={{
          width: knobSize,
          height: knobSize * 2,
          position: 'absolute',
          top: -10, // Adjusted to center it at the top
          left: '46%', // Center horizontally
          zIndex: 1,
        }}
      />
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${angle.value}deg` }],
    backgroundColor: options.backgroundColor || '#fff',
    width: width - 20,
    height: width - 20,
    borderRadius: (width - 20) / 2,
    borderWidth: options.borderWidth || 2,
    borderColor: options.borderColor || '#fff',
    opacity: wheelOpacity.value,
  }));

  const renderSvgWheel = () => (
    <View style={styles.container}>
      <Animated.View style={[animatedStyle, { alignItems: 'center', justifyContent: 'center' }]}>
        <AnimatedSvg
          width={gameScreen}
          height={gameScreen}
          viewBox={`0 0 ${width} ${width}`}
          style={{ transform: [{ rotate: `-${angleOffset.current}deg` }], margin: 10 }}
          >
          <G y={width / 2} x={width / 2}>
            {wheelPaths.map((arc, i) => {
              const [x, y] = arc.centroid;
              return (
                <G key={`arc-${i}`} >
                  <Path d={arc.path!} strokeWidth={2} fill={arc.color} />
                  {
                    options.imageSources && options.imageSources[i] ? 
                    <SVGImage
                      href={options.imageSources[i]} // Assuming you pass an array of image sources as an option
                      x={x - 25} // Adjust positioning
                      y={y - 25} // Adjust positioning
                      width={50} // Set the width of the image
                      height={50} // Set the height of the image
                      preserveAspectRatio="xMidYMid slice" // Ensure the image is scaled properly
                    /> : 
                    <Text
                      x={x} // Centering text properly
                      y={y}
                      fill={options.textColor || '#fff'}
                      textAnchor="middle"
                      fontSize={20}
                      >
                      {arc.label} {/* Ensure this is inside a <Text> component */}
                    </Text>
                  }
                </G>
              );
            })}
          </G>
        </AnimatedSvg>
      </Animated.View>
      {_renderKnob()}
    </View>
  );

  return (
    <View style={styles.container}>
      <View
        style={{
          position: 'absolute',
          width: width,
          height: height / 2,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Animated.View style={[styles.content, { padding: 10 }]}>
          {renderSvgWheel()}
        </Animated.View>
        {!started && options.playButton && (
          <Pressable onPress={handlePress} style={styles.playButton}>
            {options.playButton()}
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
   
  },
  playButton: {
    position: 'absolute', 
    zIndex: 1000,
    width: 80,
    height: 80,
    backgroundColor: '#333',
    borderRadius: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LuckyWheelReanimated;
