'use client';

import cx from 'classnames';
import { format, isWithinInterval } from 'date-fns';
import { useEffect, useState } from 'react';
import { 
  Sun, Moon, Cloud, CloudRain, CloudSnow, CloudFog, 
  CloudLightning, Wind, Droplets, Thermometer, 
  ArrowUp, ArrowDown, MapPin, RefreshCw, AlertTriangle 
} from 'lucide-react';

interface WeatherAtLocation {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current_units: {
    time: string;
    interval: string;
    temperature_2m: string;
    relative_humidity_2m?: string;
    apparent_temperature?: string;
    precipitation?: string;
    weather_code?: string;
    wind_speed_10m?: string;
  };
  current: {
    time: string;
    interval: number;
    temperature_2m: number;
    relative_humidity_2m?: number;
    apparent_temperature?: number;
    precipitation?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
  hourly_units: {
    time: string;
    temperature_2m: string;
    precipitation_probability?: string;
    weather_code?: string;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability?: number[];
    weather_code?: number[];
  };
  daily_units: {
    time: string;
    sunrise: string;
    sunset: string;
    temperature_2m_max?: string;
    temperature_2m_min?: string;
  };
  daily: {
    time: string[];
    sunrise: string[];
    sunset: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
  };
  location_name?: string; // Optional location name
}

// Weather code mapping to conditions and icons
const weatherCodes: Record<number, { condition: string, icon: (props: any) => JSX.Element }> = {
  0: { condition: 'Clear sky', icon: (props) => <Sun {...props} /> },
  1: { condition: 'Mainly clear', icon: (props) => <Sun {...props} /> },
  2: { condition: 'Partly cloudy', icon: (props) => <Cloud {...props} /> },
  3: { condition: 'Overcast', icon: (props) => <Cloud {...props} /> },
  45: { condition: 'Fog', icon: (props) => <CloudFog {...props} /> },
  48: { condition: 'Depositing rime fog', icon: (props) => <CloudFog {...props} /> },
  51: { condition: 'Light drizzle', icon: (props) => <CloudRain {...props} /> },
  53: { condition: 'Moderate drizzle', icon: (props) => <CloudRain {...props} /> },
  55: { condition: 'Dense drizzle', icon: (props) => <CloudRain {...props} /> },
  56: { condition: 'Light freezing drizzle', icon: (props) => <CloudSnow {...props} /> },
  57: { condition: 'Dense freezing drizzle', icon: (props) => <CloudSnow {...props} /> },
  61: { condition: 'Slight rain', icon: (props) => <CloudRain {...props} /> },
  63: { condition: 'Moderate rain', icon: (props) => <CloudRain {...props} /> },
  65: { condition: 'Heavy rain', icon: (props) => <CloudRain {...props} /> },
  66: { condition: 'Light freezing rain', icon: (props) => <CloudSnow {...props} /> },
  67: { condition: 'Heavy freezing rain', icon: (props) => <CloudSnow {...props} /> },
  71: { condition: 'Slight snow fall', icon: (props) => <CloudSnow {...props} /> },
  73: { condition: 'Moderate snow fall', icon: (props) => <CloudSnow {...props} /> },
  75: { condition: 'Heavy snow fall', icon: (props) => <CloudSnow {...props} /> },
  77: { condition: 'Snow grains', icon: (props) => <CloudSnow {...props} /> },
  80: { condition: 'Slight rain showers', icon: (props) => <CloudRain {...props} /> },
  81: { condition: 'Moderate rain showers', icon: (props) => <CloudRain {...props} /> },
  82: { condition: 'Violent rain showers', icon: (props) => <CloudRain {...props} /> },
  85: { condition: 'Slight snow showers', icon: (props) => <CloudSnow {...props} /> },
  86: { condition: 'Heavy snow showers', icon: (props) => <CloudSnow {...props} /> },
  95: { condition: 'Thunderstorm', icon: (props) => <CloudLightning {...props} /> },
  96: { condition: 'Thunderstorm with slight hail', icon: (props) => <CloudLightning {...props} /> },
  99: { condition: 'Thunderstorm with heavy hail', icon: (props) => <CloudLightning {...props} /> },
};

// Default weather sample
const SAMPLE = {
  latitude: 37.763283,
  longitude: -122.41286,
  generationtime_ms: 0.027894973754882812,
  utc_offset_seconds: 0,
  timezone: 'GMT',
  timezone_abbreviation: 'GMT',
  elevation: 18,
  current_units: { 
    time: 'iso8601', 
    interval: 'seconds', 
    temperature_2m: '°C',
    relative_humidity_2m: '%',
    apparent_temperature: '°C',
    precipitation: 'mm',
    weather_code: 'wmo code',
    wind_speed_10m: 'km/h'
  },
  current: { 
    time: '2024-10-07T19:30', 
    interval: 900, 
    temperature_2m: 29.3,
    relative_humidity_2m: 40,
    apparent_temperature: 28.5,
    precipitation: 0,
    weather_code: 1,
    wind_speed_10m: 15.2
  },
  hourly_units: { 
    time: 'iso8601', 
    temperature_2m: '°C',
    precipitation_probability: '%',
    weather_code: 'wmo code'
  },
  hourly: {
    time: [
      '2024-10-07T00:00',
      '2024-10-07T01:00',
      '2024-10-07T02:00',
      '2024-10-07T03:00',
      '2024-10-07T04:00',
      '2024-10-07T05:00',
      '2024-10-07T06:00',
      '2024-10-07T07:00',
      '2024-10-07T08:00',
      '2024-10-07T09:00',
      '2024-10-07T10:00',
      '2024-10-07T11:00',
      '2024-10-07T12:00',
      '2024-10-07T13:00',
      '2024-10-07T14:00',
      '2024-10-07T15:00',
      '2024-10-07T16:00',
      '2024-10-07T17:00',
      '2024-10-07T18:00',
      '2024-10-07T19:00',
      '2024-10-07T20:00',
      '2024-10-07T21:00',
      '2024-10-07T22:00',
      '2024-10-07T23:00',
      '2024-10-08T00:00',
      '2024-10-08T01:00',
      '2024-10-08T02:00',
      '2024-10-08T03:00',
      '2024-10-08T04:00',
      '2024-10-08T05:00',
      '2024-10-08T06:00',
      '2024-10-08T07:00',
      '2024-10-08T08:00',
      '2024-10-08T09:00',
      '2024-10-08T10:00',
      '2024-10-08T11:00',
      '2024-10-08T12:00',
      '2024-10-08T13:00',
      '2024-10-08T14:00',
      '2024-10-08T15:00',
      '2024-10-08T16:00',
      '2024-10-08T17:00',
      '2024-10-08T18:00',
      '2024-10-08T19:00',
      '2024-10-08T20:00',
      '2024-10-08T21:00',
      '2024-10-08T22:00',
      '2024-10-08T23:00',
      '2024-10-09T00:00',
      '2024-10-09T01:00',
      '2024-10-09T02:00',
      '2024-10-09T03:00',
      '2024-10-09T04:00',
      '2024-10-09T05:00',
      '2024-10-09T06:00',
      '2024-10-09T07:00',
      '2024-10-09T08:00',
      '2024-10-09T09:00',
      '2024-10-09T10:00',
      '2024-10-09T11:00',
      '2024-10-09T12:00',
      '2024-10-09T13:00',
      '2024-10-09T14:00',
      '2024-10-09T15:00',
      '2024-10-09T16:00',
      '2024-10-09T17:00',
      '2024-10-09T18:00',
      '2024-10-09T19:00',
      '2024-10-09T20:00',
      '2024-10-09T21:00',
      '2024-10-09T22:00',
      '2024-10-09T23:00',
      '2024-10-10T00:00',
      '2024-10-10T01:00',
      '2024-10-10T02:00',
      '2024-10-10T03:00',
      '2024-10-10T04:00',
      '2024-10-10T05:00',
      '2024-10-10T06:00',
      '2024-10-10T07:00',
      '2024-10-10T08:00',
      '2024-10-10T09:00',
      '2024-10-10T10:00',
      '2024-10-10T11:00',
      '2024-10-10T12:00',
      '2024-10-10T13:00',
      '2024-10-10T14:00',
      '2024-10-10T15:00',
      '2024-10-10T16:00',
      '2024-10-10T17:00',
      '2024-10-10T18:00',
      '2024-10-10T19:00',
      '2024-10-10T20:00',
      '2024-10-10T21:00',
      '2024-10-10T22:00',
      '2024-10-10T23:00',
      '2024-10-11T00:00',
      '2024-10-11T01:00',
      '2024-10-11T02:00',
      '2024-10-11T03:00',
    ],
    temperature_2m: [
      36.6, 32.8, 29.5, 28.6, 29.2, 28.2, 27.5, 26.6, 26.5, 26, 25, 23.5, 23.9,
      24.2, 22.9, 21, 24, 28.1, 31.4, 33.9, 32.1, 28.9, 26.9, 25.2, 23, 21.1,
      19.6, 18.6, 17.7, 16.8, 16.2, 15.5, 14.9, 14.4, 14.2, 13.7, 13.3, 12.9,
      12.5, 13.5, 15.8, 17.7, 19.6, 21, 21.9, 22.3, 22, 20.7, 18.9, 17.9, 17.3,
      17, 16.7, 16.2, 15.6, 15.2, 15, 15, 15.1, 14.8, 14.8, 14.9, 14.7, 14.8,
      15.3, 16.2, 17.9, 19.6, 20.5, 21.6, 21, 20.7, 19.3, 18.7, 18.4, 17.9,
      17.3, 17, 17, 16.8, 16.4, 16.2, 16, 15.8, 15.7, 15.4, 15.4, 16.1, 16.7,
      17, 18.6, 19, 19.5, 19.4, 18.5, 17.9, 17.5, 16.7, 16.3, 16.1,
    ],
    precipitation_probability: [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      5, 5, 5, 10, 10, 10, 5, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 10, 10, 10, 20, 20, 20, 15, 15, 15, 10, 10, 10, 
      5, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    weather_code: [
      0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 2, 3, 3, 1, 1, 0, 0,
      0, 0, 0, 0, 1, 1, 1, 2, 2, 3, 3, 3, 2, 2, 2, 2, 3, 3, 2, 1,
      1, 1, 1, 3, 61, 61, 3, 3, 2, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 3,
      3, 3, 3, 2, 1, 1, 3, 61, 61, 61, 61, 3, 3, 3, 3, 2, 2, 2, 2, 
      2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 0, 0
    ]
  },
  daily_units: {
    time: 'iso8601',
    sunrise: 'iso8601',
    sunset: 'iso8601',
    temperature_2m_max: '°C',
    temperature_2m_min: '°C'
  },
  daily: {
    time: [
      '2024-10-07',
      '2024-10-08',
      '2024-10-09',
      '2024-10-10',
      '2024-10-11',
    ],
    sunrise: [
      '2024-10-07T07:15',
      '2024-10-08T07:16',
      '2024-10-09T07:17',
      '2024-10-10T07:18',
      '2024-10-11T07:19',
    ],
    sunset: [
      '2024-10-07T19:00',
      '2024-10-08T18:58',
      '2024-10-09T18:57',
      '2024-10-10T18:55',
      '2024-10-11T18:54',
    ],
    temperature_2m_max: [36.6, 22.3, 21.6, 19.5, 18.2],
    temperature_2m_min: [21.0, 12.5, 14.7, 15.4, 14.8]
  },
  location_name: 'San Francisco, CA'
};

function n(num: number): number {
  return Math.ceil(num);
}

// Get the weather icon based on weather code and day/night status
function getWeatherIcon(weatherCode: number = 0, isDay: boolean, size = 24) {
  const code = weatherCodes[weatherCode] || weatherCodes[0];
  
  // For clear sky, use Sun or Moon based on time of day
  if (weatherCode === 0 || weatherCode === 1) {
    return isDay ? 
      <Sun size={size} className="text-yellow-300" /> : 
      <Moon size={size} className="text-indigo-100" />;
  }
  
  // For all other conditions, use the appropriate icon
  return <code.icon size={size} className={isDay ? "text-white" : "text-indigo-100"} />;
}

// Convert C to F if needed
function formatTemperature(temp: number, unit: string): string {
  if (unit === '°F') {
    return `${n((temp * 9/5) + 32)}${unit}`;
  }
  return `${n(temp)}${unit}`;
}

export function Weather({
  weatherAtLocation = SAMPLE,
  units = 'metric'
}: {
  weatherAtLocation?: WeatherAtLocation;
  units?: 'metric' | 'imperial';
}) {
  const tempUnit = units === 'metric' ? '°C' : '°F';
  const windUnit = units === 'metric' ? 'km/h' : 'mph';
  
  // Get current weather conditions and daily high/low
  const currentTemp = weatherAtLocation.current.temperature_2m;
  const currentHigh = weatherAtLocation.daily?.temperature_2m_max?.[0] ?? 
    Math.max(...weatherAtLocation.hourly.temperature_2m.slice(0, 24));
  const currentLow = weatherAtLocation.daily?.temperature_2m_min?.[0] ?? 
    Math.min(...weatherAtLocation.hourly.temperature_2m.slice(0, 24));
  
  // Determine if it's day or night
  const isDay = isWithinInterval(new Date(weatherAtLocation.current.time), {
    start: new Date(weatherAtLocation.daily.sunrise[0]),
    end: new Date(weatherAtLocation.daily.sunset[0]),
  });

  // Get current weather condition
  const weatherCode = weatherAtLocation.current.weather_code ?? 1;
  const weatherCondition = weatherCodes[weatherCode]?.condition || 'Clear';

  // State for responsive design
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<'hourly' | 'daily'>('hourly');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Number of hours to show in the hourly forecast
  const hoursToShow = isMobile ? 5 : 6;

  // Find the index of the current time or the next closest time
  const currentTimeIndex = weatherAtLocation.hourly.time.findIndex(
    (time) => new Date(time) >= new Date(weatherAtLocation.current.time),
  );

  // Slice the arrays to get the desired number of items for hourly forecast
  const displayTimes = weatherAtLocation.hourly.time.slice(
    currentTimeIndex,
    currentTimeIndex + hoursToShow,
  );
  
  const displayTemperatures = weatherAtLocation.hourly.temperature_2m.slice(
    currentTimeIndex,
    currentTimeIndex + hoursToShow,
  );
  
  const displayWeatherCodes = weatherAtLocation.hourly.weather_code?.slice(
    currentTimeIndex, 
    currentTimeIndex + hoursToShow
  ) || Array(hoursToShow).fill(1);
  
  const displayPrecipProb = weatherAtLocation.hourly.precipitation_probability?.slice(
    currentTimeIndex,
    currentTimeIndex + hoursToShow
  ) || Array(hoursToShow).fill(0);

  return (
    <div
      className={cx(
        'flex flex-col gap-4 rounded-2xl p-4 shadow-lg max-w-[500px] transition-all duration-300',
        {
          'bg-gradient-to-br from-blue-400 to-blue-600': isDay,
        },
        {
          'bg-gradient-to-br from-indigo-900 to-indigo-950': !isDay,
        },
      )}
    >
      {/* Location and last updated */}
      <div className="flex justify-between items-center text-blue-50">
        <div className="flex items-center gap-1">
          <MapPin size={16} className="text-blue-200" />
          <span className="font-medium">{weatherAtLocation.location_name || `${weatherAtLocation.latitude.toFixed(2)}, ${weatherAtLocation.longitude.toFixed(2)}`}</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <RefreshCw size={12} className="text-blue-200" />
          <span>Updated {format(lastUpdated, 'h:mm a')}</span>
        </div>
      </div>
      
      {/* Current weather */}
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row items-center gap-3">
          {getWeatherIcon(weatherCode, isDay, 48)}
          
          <div className="flex flex-col">
            <div className="text-4xl font-bold text-white">
              {formatTemperature(currentTemp, tempUnit)}
            </div>
            <div className="text-blue-100 text-sm">{weatherCondition}</div>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className="flex items-center text-white">
            <ArrowUp size={16} className="text-red-300" />
            <span className="ml-1">{formatTemperature(currentHigh, tempUnit)}</span>
          </div>
          <div className="flex items-center text-white">
            <ArrowDown size={16} className="text-blue-300" />
            <span className="ml-1">{formatTemperature(currentLow, tempUnit)}</span>
          </div>
        </div>
      </div>
      
      {/* Additional weather details */}
      <div className="grid grid-cols-3 gap-2 p-2 bg-white/10 rounded-lg">
        <div className="flex flex-col items-center text-white">
          <div className="flex items-center justify-center gap-1">
            <Droplets size={16} className="text-blue-200" />
            <span className="text-sm font-medium">Humidity</span>
          </div>
          <span className="text-base">{weatherAtLocation.current.relative_humidity_2m || '40'}%</span>
        </div>
        
        <div className="flex flex-col items-center text-white">
          <div className="flex items-center justify-center gap-1">
            <Thermometer size={16} className="text-red-200" />
            <span className="text-sm font-medium">Feels Like</span>
          </div>
          <span className="text-base">{formatTemperature(weatherAtLocation.current.apparent_temperature || currentTemp, tempUnit)}</span>
        </div>
        
        <div className="flex flex-col items-center text-white">
          <div className="flex items-center justify-center gap-1">
            <Wind size={16} className="text-blue-200" />
            <span className="text-sm font-medium">Wind</span>
          </div>
          <span className="text-base">{weatherAtLocation.current.wind_speed_10m || '15'} {windUnit}</span>
        </div>
      </div>
      
      {/* Tab selector for hourly/daily forecast */}
      <div className="flex border-b border-white/20">
        <button 
          className={`flex-1 py-2 text-center text-sm font-medium ${activeTab === 'hourly' ? 'text-white border-b-2 border-white' : 'text-blue-100'}`}
          onClick={() => setActiveTab('hourly')}
        >
          Hourly
        </button>
        <button 
          className={`flex-1 py-2 text-center text-sm font-medium ${activeTab === 'daily' ? 'text-white border-b-2 border-white' : 'text-blue-100'}`}
          onClick={() => setActiveTab('daily')}
        >
          5-Day
        </button>
      </div>

      {/* Hourly forecast */}
      {activeTab === 'hourly' && (
        <div className="flex justify-between">
          {displayTimes.map((time, index) => (
            <div key={time} className="flex flex-col items-center gap-1">
              <div className="text-blue-100 text-xs">
                {format(new Date(time), 'ha')}
              </div>
              {getWeatherIcon(displayWeatherCodes[index], isDay, 24)}
              <div className="text-white text-sm">
                {formatTemperature(displayTemperatures[index], tempUnit)}
              </div>
              {displayPrecipProb[index] > 0 && (
                <div className="text-xs text-blue-200 flex items-center">
                  <CloudRain size={10} className="mr-1" />
                  {displayPrecipProb[index]}%
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Daily forecast */}
      {activeTab === 'daily' && (
        <div className="flex flex-col gap-2">
          {weatherAtLocation.daily.time.map((day, index) => (
            <div key={day} className="flex justify-between items-center py-2 border-b border-white/10 last:border-0">
              <div className="flex items-center gap-3">
                {getWeatherIcon(
                  weatherAtLocation.hourly.weather_code?.[index * 24 + 12] || 1, 
                  true, 
                  24
                )}
                <span className="text-white">{index === 0 ? 'Today' : format(new Date(day), 'EEE, MMM d')}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  <ArrowDown size={14} className="text-blue-300" />
                  <span className="text-white ml-1">
                    {formatTemperature(
                      weatherAtLocation.daily.temperature_2m_min?.[index] ?? 
                      Math.min(...weatherAtLocation.hourly.temperature_2m.slice(index * 24, (index + 1) * 24)),
                      tempUnit
                    )}
                  </span>
                </div>
                <div className="flex items-center">
                  <ArrowUp size={14} className="text-red-300" />
                  <span className="text-white ml-1">
                    {formatTemperature(
                      weatherAtLocation.daily.temperature_2m_max?.[index] ?? 
                      Math.max(...weatherAtLocation.hourly.temperature_2m.slice(index * 24, (index + 1) * 24)),
                      tempUnit
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Data source attribution */}
      <div className="text-xs text-blue-100/70 text-center mt-2">
        Weather data provided by Open-Meteo.com
      </div>
    </div>
  );
}
