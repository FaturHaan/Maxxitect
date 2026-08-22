import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Dimensions, FlatList, 
  Image, TouchableOpacity, ScrollView, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const IMAGE_CAROUSEL_WIDTH = width * 0.8;

// Gambar-gambar untuk carousel di slide pertama
const FIRST_SLIDE_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCUNyyvgbB8b1j4uK2BK77-rYmZQ6uOaR1hQY3Bkx_10r2mN1UjXZPe2ztLYHpMnbsw3v3x-JgW3MLC99skXCCUmtKhL9ZVjNauTtVlbVVCoqdYjapBO8F23UZ6seEqLakzDzO7ZB48VCCKUqjB2_1e8WoOglW2RfyFrTB0zatkqMztpChROI0ERqfBQKNGcPmWCwvKC_X5YunvGCqTfT-mcpUScQlo1eOmgkz6ja8riv6ERZcC8x9xFqiSXzHgpO7jNag',
  // Perkebunan sawit / lahan hijau
  'https://i.pinimg.com/1200x/b8/ea/c2/b8eac2627cee614d8b6faa4783612296.jpg',
  // Cabai merah
  'https://i.pinimg.com/736x/42/49/59/4249593140e621ea69e70a5a379fc5e0.jpg',
  // Sawah / padi
  'https://i.pinimg.com/736x/cf/52/e0/cf52e0a234797b2f9715599b7e114f87.jpg',
];

// Gambar-gambar untuk carousel di slide kedua
const SECOND_SLIDE_IMAGES = [
  // Scan daun dengan HP
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAHFO4l3pUeQvq82qiinCz9L9mIGaAwFhnZtlj9LE7bj4prsvR7jc6pvJTXof3eNZacT-whuyPZUadHmZBFNhIZcL7pXy-5Scnfeme_mSw9bJTEvc5FPaNsL_9prL4fngFdB8CcnU8SximxzKSVLMn264u8j4AVYYahn6cH6fPBxDRKJ-ziq7RmpChceV5m0MBFFROfwAOlONTweGhkagljNrIUheFO0kfbGBlGzqpDl2Vd6WeMe7G4Dg',
  // Daun berpenyakit (bercak/hama) - menggunakan placeholder Pexels/Unsplash yang relevan
  'https://i.pinimg.com/1200x/94/64/cd/9464cd82635ada477f28f536d5eb73c4.jpg',
  // Petani menyemprot lahan - menggunakan placeholder Pexels/Unsplash yang relevan
  'https://i.pinimg.com/1200x/3e/29/90/3e2990bd0378cf6e52458bf17d3043a1.jpg',
];

const SLIDES = [
  {
    id: '1',
    title: 'Selamat Datang di Maxxitect',
    description: 'Asisten pribadi Anda untuk menjaga kesehatan tanaman. Temukan solusi dari setiap masalah lahan Anda di ujung jari.',
    images: FIRST_SLIDE_IMAGES, // Multiple images untuk carousel
  },
  {
    id: '2',
    title: 'Diagnosis AI Cerdas & Akurat',
    description: 'Cukup foto tanaman yang bermasalah atau ketik gejala yang Anda lihat, AI kami akan menganalisis penyakit dan hama secara real-time.',
    images: SECOND_SLIDE_IMAGES, // Multiple images untuk carousel slide 2
  },
  {
    id: '3',
    title: 'Solusi Pengobatan Tepat Sasaran',
    description: 'Dapatkan rekomendasi produk Maxxi Agri yang paling tepat dosis dan kegunaannya untuk memulihkan hasil panen Anda.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDHYF3TnQKKC9JEgTJoFdRQojVsumGQAeESG3WJZlNcyxu-ciHz2iHRKm0atU-Z39d0mNyY2YMTq5DI9WX55v98tXGkUv28QFAgsvybq9LjXt7ldx_NUVXGbv2UlYQVgVXLM257b01ch0qs7lvuvsXdeJ5vHicyEKPKez_LAtt_O4qmYiqahjx7z5adbqqH6iK19wXuV0dA5j1N56bBw_XKHh-D6RhuXL1R9Z3bgTvJz4N2x76aPxhbJ5KqY65izNCbMT4',
  }
];

// Komponen carousel gambar di dalam slide pertama
function ImageCarousel({ images }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);
  const autoPlayRef = useRef(null);

  // Auto-play carousel setiap 3 detik
  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const nextIdx = (prev + 1) % images.length;
        scrollRef.current?.scrollTo({
          x: nextIdx * IMAGE_CAROUSEL_WIDTH,
          animated: true,
        });
        return nextIdx;
      });
    }, 3000);

    return () => clearInterval(autoPlayRef.current);
  }, [images.length]);

  const handleScroll = useCallback((event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / IMAGE_CAROUSEL_WIDTH);
    setActiveIndex(index);
  }, []);

  const goToPrev = () => {
    // Reset auto-play timer saat user navigasi manual
    clearInterval(autoPlayRef.current);
    const prevIndex = activeIndex > 0 ? activeIndex - 1 : images.length - 1;
    scrollRef.current?.scrollTo({
      x: prevIndex * IMAGE_CAROUSEL_WIDTH,
      animated: true,
    });
    setActiveIndex(prevIndex);
    // Restart auto-play
    autoPlayRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const nextIdx = (prev + 1) % images.length;
        scrollRef.current?.scrollTo({
          x: nextIdx * IMAGE_CAROUSEL_WIDTH,
          animated: true,
        });
        return nextIdx;
      });
    }, 3000);
  };

  const goToNext = () => {
    clearInterval(autoPlayRef.current);
    const nextIndex = activeIndex < images.length - 1 ? activeIndex + 1 : 0;
    scrollRef.current?.scrollTo({
      x: nextIndex * IMAGE_CAROUSEL_WIDTH,
      animated: true,
    });
    setActiveIndex(nextIndex);
    // Restart auto-play
    autoPlayRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const nextIdx = (prev + 1) % images.length;
        scrollRef.current?.scrollTo({
          x: nextIdx * IMAGE_CAROUSEL_WIDTH,
          animated: true,
        });
        return nextIdx;
      });
    }, 3000);
  };

  return (
    <View style={styles.imageContainer}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={{ width: IMAGE_CAROUSEL_WIDTH, height: IMAGE_CAROUSEL_WIDTH }}
      >
        {images.map((uri, index) => (
          <Image
            key={index}
            source={{ uri }}
            style={{
              width: IMAGE_CAROUSEL_WIDTH,
              height: IMAGE_CAROUSEL_WIDTH,
              resizeMode: 'cover',
            }}
          />
        ))}
      </ScrollView>

      {/* Tombol navigasi kiri */}
      <TouchableOpacity
        style={[styles.carouselArrow, styles.carouselArrowLeft]}
        onPress={goToPrev}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back-outline" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Tombol navigasi kanan */}
      <TouchableOpacity
        style={[styles.carouselArrow, styles.carouselArrowRight]}
        onPress={goToNext}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-forward-outline" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Dot indicators di dalam gambar */}
      <View style={styles.carouselDots}>
        {images.map((_, i) => (
          <View
            key={i}
            style={[
              styles.carouselDot,
              i === activeIndex
                ? styles.carouselDotActive
                : styles.carouselDotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slidesRef = useRef(null);

  const viewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('@has_onboarded', 'true');
      // Reset routing agar tidak bisa di-back ke onboarding
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (e) {
      console.error('Error saving onboarding status', e);
    }
  };

  const nextSlide = () => {
    if (currentIndex < SLIDES.length - 1) {
      slidesRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      finishOnboarding();
    }
  };

  const renderItem = ({ item }) => {
    return (
      <View style={styles.slide}>
        {/* Jika slide punya multiple images, tampilkan carousel */}
        {item.images ? (
          <ImageCarousel images={item.images} />
        ) : (
          <View style={styles.imageContainer}>
            <Image source={{ uri: item.image }} style={styles.image} />
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    );
  };

  const resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem('@has_onboarded');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Onboarding' }],
      });
    } catch (e) {
      console.error('Error resetting onboarding', e);
    }
  };

  return (
    <View style={styles.container}>
      {/* Tombol Lewati di pojok kanan atas */}
      <View style={styles.header}>
        <TouchableOpacity onPress={finishOnboarding}>
          <Text style={styles.skipText}>Lewati</Text>
        </TouchableOpacity>
        {__DEV__ && (
          <TouchableOpacity style={styles.devResetBtn} onPress={resetOnboarding}>
            <Text style={styles.devResetText}>🔄 Reset Onboarding</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={SLIDES}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        ref={slidesRef}
      />

      <View style={styles.footer}>
        <View style={styles.paginator}>
          {SLIDES.map((_, i) => {
            const isActive = i === currentIndex;
            return (
              <View
                key={i.toString()}
                style={[
                  styles.dot,
                  isActive ? styles.dotActive : styles.dotInactive,
                ]}
              />
            );
          })}
        </View>

        {currentIndex === SLIDES.length - 1 ? (
          <TouchableOpacity style={styles.btnPrimary} onPress={finishOnboarding}>
            <View style={styles.btnContent}>
              <Text style={styles.btnPrimaryText}>Mulai Diagnosis Sekarang</Text>
              <Ionicons name="arrow-forward-outline" size={20} color="#fff" style={styles.btnArrow} />
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.btnPrimary} onPress={nextSlide}>
            <Text style={styles.btnPrimaryText}>Selanjutnya</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9', // Sesuai dengan bg-surface di desain
  },
  header: {
    paddingTop: 50,
    paddingRight: 20,
    alignItems: 'flex-end',
    zIndex: 10,
  },
  skipText: {
    color: '#007A33', // Warna primary
    fontSize: 16,
    fontWeight: 'bold',
  },
  devResetBtn: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff3cd',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  devResetText: {
    color: '#856404',
    fontSize: 12,
    fontWeight: '600',
  },
  slide: {
    width,
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  imageContainer: {
    width: IMAGE_CAROUSEL_WIDTH,
    height: IMAGE_CAROUSEL_WIDTH, // Aspect ratio 1:1 square
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#007A33',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    backgroundColor: '#fff',
    marginBottom: 40,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  // Styles untuk carousel arrows
  carouselArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  carouselArrowLeft: {
    left: 10,
  },
  carouselArrowRight: {
    right: 10,
  },
  // Styles untuk carousel dot indicators (di dalam gambar)
  carouselDots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  carouselDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  carouselDotActive: {
    backgroundColor: '#fff',
    width: 10,
    height: 10,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  carouselDotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1c1c',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#3f4a3e',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  paginator: {
    flexDirection: 'row',
    height: 10,
    marginBottom: 30,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: '#007A33',
  },
  dotInactive: {
    width: 8,
    backgroundColor: '#b0cfad',
  },
  btnPrimary: {
    backgroundColor: '#007A33',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007A33',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnArrow: {
    marginLeft: 8,
  },
});
