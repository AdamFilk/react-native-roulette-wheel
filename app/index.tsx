
import LukcyWheel from "@/components/LuckyWheel/LukcyWheel";
import LuckyWheelReanimated from "@/components/LuckyWheelReanimated/LuckyWheelReanimated";
import { useRef } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
  

export default function HomePage(){
    const wheelRef = useRef<{ reset: () => void } | null>(null);
    const handleWinner = (index: number) => {
        Alert.alert(
            'Got one',
            'It is at index '+index,
            [
              {
                text: 'Cancel',
                onPress: () => wheelRef?.current?.reset(),
                style: 'cancel',
              },
            ],
            {
              cancelable: true,
              onDismiss: () => wheelRef?.current?.reset()
            },
        );
    };
    const mockOptions = {
        rewards: ['Reward 1', 'Reward 2', 'Reward 3', 'Reward 4', 'Reward 5', 'Reward 6'],
        imageSources: [
            'https://i.pinimg.com/originals/35/bd/6b/35bd6b54825d5c9766c3d1da2f2957bf.jpg',
            'https://i.pinimg.com/originals/35/bd/6b/35bd6b54825d5c9766c3d1da2f2957bf.jpg',
            'https://i.pinimg.com/originals/35/bd/6b/35bd6b54825d5c9766c3d1da2f2957bf.jpg',
            'https://i.pinimg.com/originals/35/bd/6b/35bd6b54825d5c9766c3d1da2f2957bf.jpg',
            'https://i.pinimg.com/originals/35/bd/6b/35bd6b54825d5c9766c3d1da2f2957bf.jpg'
        ],
        weights: [0,0,0,0,60,0],
        colors: ['#bc244a', '#bc244a', '#bc244a', '#bc244a', '#bc244a'],
        innerRadius: 50,
        textAngle: 'horizontal' as const, // Render text horizontally
        borderColor: '#fff',
        borderWidth: 2,
        backgroundColor: '#FFD700',
        textColor: '#fff',
        duration: 4000, // Spin duration in milliseconds
        winner: 2, // Predefined winner index (optional)
        playButton: () => (
            <Text style={styles.playButtonText}>Play</Text>
        ),
        onRef: (ref: any) => {
            wheelRef.current = ref
        },
        getWinner: handleWinner
      };
    
     
    
      return (
        <View style={styles.container}>
          {/* Wheel of Fortune Component with Mock Options */}
          <LuckyWheelReanimated options={mockOptions} />
        </View>
      );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e0e0e0',
    },
    playButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
})