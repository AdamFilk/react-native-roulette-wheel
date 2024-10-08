import * as d3Shape from 'd3-shape';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    Pressable,
    StyleSheet,
    View
} from 'react-native';
import Svg, { G, Path, Text, Image as SVGImage } from 'react-native-svg';

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

const LukcyWheel: React.FC<WheelOfFortuneProps> = ({ options }) => {
  const [enabled, setEnabled] = useState(false);
  const [started, setStarted] = useState(false);
  const [wheelPaths, setWheelPaths] = useState<WheelPath[]>([]);
  const [gameScreen] = useState(new Animated.Value(width - 40));
  const [wheelOpacity] = useState(new Animated.Value(1));

  const oneTurn = 360;
  const angle = useRef<number>(0);
  const angleBySegment = useRef<number>(0);
  const angleOffset = useRef<number>(0);

  const Rewards = options.rewards;
  const RewardCount = Rewards.length;

  const _angle = useRef(new Animated.Value(0)).current;

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

    const data = Array.from({ length: RewardCount }, (_, i) =>  1); // Create an array of numbers [1, 2, 3, ...]
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

  useEffect(() => {
    const listener = _angle.addListener((event) => {
      if (enabled) {
        setEnabled(false);
      }
      angle.current = event.value;
    });

    return () => _angle.removeListener(listener);
  }, [enabled]);

  const resetWheel = () => {
    setEnabled(false);
    setStarted(false);
    // Animate back to 0 degrees
    Animated.timing(_angle, {
      toValue: 0, // Reset to 0 degrees
      duration: 1000, // Duration for the reset animation
      useNativeDriver: true,
    }).start(() => {
      prepareWheel(); // Prepare the wheel again after resetting
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
  
      // Animate the wheel to the winner's position
      Animated.timing(_angle, {
        toValue:
          365 - winnerIndex * (oneTurn / RewardCount) + 360 * (duration / 1000),
        duration: duration,
        useNativeDriver: true,
      }).start(() => {
        options.getWinner?.(winnerIndex); // Pass the winner index
        setEnabled(false); // Reset enabled state after spin is finished
      });
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

  const renderSvgWheel = () => (
    <View style={styles.container}>
      <Animated.View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          transform: [
            {
              rotate: _angle.interpolate({
                inputRange: [-oneTurn, 0, oneTurn],
                outputRange: [`-${oneTurn + 180}deg`, `180deg`, `${oneTurn + 180}deg`],
              }),
            },
          ],
          backgroundColor: options.backgroundColor || '#fff',
          width: width - 20,
          height: width - 20,
          borderRadius: (width - 20) / 2,
          borderWidth: options.borderWidth || 2,
          borderColor: options.borderColor || '#fff',
          opacity: wheelOpacity,
        }}>
        <AnimatedSvg
          width={gameScreen}
          height={gameScreen}
          viewBox={`0 0 ${width} ${width}`}
          style={{ transform: [{ rotate: `-${angleOffset.current + 180}deg` }], margin: 10 }}>
          <G y={width / 2} x={width / 2}>
            {wheelPaths.map((arc, i) => {
              const [x, y] = arc.centroid;
              return (
                <G key={`arc-${i}`}>
                  <Path d={arc.path!} strokeWidth={2} fill={arc.color} />
                  {
                    options.imageSources && options.imageSources[i] ? <SVGImage
                    href={options.imageSources[i]} // Assuming you pass an array of image sources as an option
                    x={x - 20} // Adjust positioning
                    y={y - 20} // Adjust positioning
                    width={50} // Set the width of the image
                    height={50} // Set the height of the image
                    preserveAspectRatio="xMidYMid slice" // Ensure the image is scaled properly
                  /> : 
                  <Text
                  x={x} // Centering text properly
                  y={y}
                  fill={options.textColor || '#fff'}
                  textAnchor="middle"
                  fontSize={20}>
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
      {/* Wrap the play button in a relative container */}
     
       
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {},
  playButton: {
    position: 'absolute', 
    zIndex: 1000,
    width: 80,
    height: 80,
    backgroundColor: '#333',
    borderRadius: 250,
    justifyContent: 'center',
    alignItems: 'center'
    // Adjust the size and positioning as needed
  },
});

export default LukcyWheel;
