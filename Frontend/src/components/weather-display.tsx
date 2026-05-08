import { Cloud, Sun, CloudRain, Wind, Droplets, Eye } from "lucide-react";

interface WeatherDisplayProps {
  weather: {
    temperature?: number;
    humidity?: number;
    weather?: string;
    description?: string;
    wind_speed?: number;
    pressure?: number;
    visibility?: number;
  } | null;
  compact?: boolean;
}

export function WeatherDisplay({ weather, compact = false }: WeatherDisplayProps) {
  if (!weather || !weather.temperature) {
    return null;
  }

  const getWeatherIcon = (weatherMain?: string) => {
    switch (weatherMain?.toLowerCase()) {
      case 'clear':
        return <Sun className="h-4 w-4 text-yellow-500" />;
      case 'clouds':
        return <Cloud className="h-4 w-4 text-gray-500" />;
      case 'rain':
      case 'drizzle':
        return <CloudRain className="h-4 w-4 text-blue-500" />;
      default:
        return <Cloud className="h-4 w-4 text-gray-500" />;
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1">
        {getWeatherIcon(weather.weather)}
        <span>{Math.round(weather.temperature || 0)}°C</span>
        {weather.wind_speed && (
          <span className="flex items-center gap-1">
            <Wind className="h-3 w-3" />
            {weather.wind_speed}m/s
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100">Match Conditions</h4>
        {getWeatherIcon(weather.weather)}
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-white/50 dark:bg-black/20 rounded">
            <Sun className="h-4 w-4 text-orange-500" />
          </div>
          <div>
            <div className="font-medium text-blue-900 dark:text-blue-100">
              {Math.round(weather.temperature || 0)}°C
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300 capitalize">
              {weather.description || weather.weather}
            </div>
          </div>
        </div>

        {weather.humidity && (
          <div className="flex items-center gap-2">
            <div className="p-1 bg-white/50 dark:bg-black/20 rounded">
              <Droplets className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <div className="font-medium text-blue-900 dark:text-blue-100">
                {weather.humidity}%
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300">Humidity</div>
            </div>
          </div>
        )}

        {weather.wind_speed && (
          <div className="flex items-center gap-2">
            <div className="p-1 bg-white/50 dark:bg-black/20 rounded">
              <Wind className="h-4 w-4 text-gray-500" />
            </div>
            <div>
              <div className="font-medium text-blue-900 dark:text-blue-100">
                {weather.wind_speed} m/s
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300">Wind Speed</div>
            </div>
          </div>
        )}

        {weather.visibility && (
          <div className="flex items-center gap-2">
            <div className="p-1 bg-white/50 dark:bg-black/20 rounded">
              <Eye className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <div className="font-medium text-blue-900 dark:text-blue-100">
                {weather.visibility} km
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300">Visibility</div>
            </div>
          </div>
        )}
      </div>

      {weather.pressure && (
        <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700 text-xs text-blue-700 dark:text-blue-300">
          Pressure: {weather.pressure} hPa
        </div>
      )}
    </div>
  );
}
