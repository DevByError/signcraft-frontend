const API_KEY = "REMOVED_OPENWEATHER_KEY";
const API_URL = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";

export const fetchWeather = async (location: string, temperatureUnit: 'F' | 'C' = 'C') => {
  try {
    // Fetch weather from OpenWeather API
    const response = await fetch(
      `${API_URL}${encodeURIComponent(location)}&appid=${API_KEY}`
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Location "${location}" not found`);
    }

    const data = await response.json();
    
    const temperature = Math.round(data.main.temp);
    const temperatureCelsius = data.main.temp;
    const temperatureFahrenheit = (temperatureCelsius * 9/5) + 32;
    const displayTemp = temperatureUnit === 'F' ? Math.round(temperatureFahrenheit) : temperature;
    
    const condition = data.weather[0].main;
    const description = data.weather[0].description;
    
    // Map OpenWeather conditions to icons
    const icon = getWeatherIcon(data.weather[0].main.toLowerCase());

    return {
      temperature: displayTemp,
      condition: condition,
      description: description,
      icon: icon,
      location: `${data.name}${data.sys.country ? ', ' + data.sys.country : ''}`,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 10) / 10, // Round to 1 decimal
      feelsLike: Math.round(temperatureUnit === 'F' ? ((data.main.feels_like * 9/5) + 32) : data.main.feels_like),
      pressure: data.main.pressure,
      clouds: data.clouds.all,
    };
  } catch (error) {
    console.error('Weather fetch error:', error);
    throw error;
  }
};

const getWeatherIcon = (condition: string): string => {
  const iconMap: Record<string, string> = {
    'clear sky': '☀️',
    'clear': '☀️',
    'few clouds': '⛅',
    'scattered clouds': '☁️',
    'overcast clouds': '☁️',
    'broken clouds': '☁️',
    'clouds': '☁️',
    'shower rain': '🌧️',
    'rain': '🌧️',
    'thunderstorm': '⛈️',
    'snow': '❄️',
    'mist': '🌫️',
    'smoke': '🌫️',
    'haze': '🌫️',
    'dust': '🌫️',
    'fog': '🌫️',
    'sand': '🌫️',
    'ash': '🌫️',
    'squall': '💨',
    'tornado': '🌪️',
  };
  
  for (const [key, icon] of Object.entries(iconMap)) {
    if (condition.includes(key)) {
      return icon;
    }
  }
  
  return '🌡️'; // Default icon
};
