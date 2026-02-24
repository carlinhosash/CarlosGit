import { useState, useEffect } from 'react';
import { Cloud, Droplets, Wind, Search } from 'lucide-react';

interface WeatherData {
  location: {
    name: string;
  };
  current: {
    temp_c: number;
    condition: {
      text: string;
      icon: string;
    };
    humidity: number;
    wind_kph: number;
  };
}

export default function App() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [cityInput, setCityInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      console.log('WebSocket message received:', event.data);
      try {
        const message = JSON.parse(event.data);
        console.log('Parsed message:', message);
        if (message.location && message.current) {
          setData(message);
          setIsLoading(false);
        } else {
          console.log('Message does not contain location and current properties');
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        setError('Erro ao processar dados do clima.');
        setIsLoading(false);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleConsultar = async () => {
    if (!cityInput.trim()) {
      setError('Por favor, digite o nome de uma cidade.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch('/api/get-weather', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ city: cityInput }),
      });

      if (!response.ok) {
        throw new Error('Não foi possível buscar os dados do clima. Verifique o nome da cidade.');
      }
      console.log('Webhook triggered successfully');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocorreu um erro desconhecido.');
      }
      setIsLoading(false);
    }
  };

  const WeatherIcon = ({ icon, text }: { icon: string; text: string }) => {
    return <img src={icon} alt={text} className="w-24 h-24 mx-auto" />;
  };

  return (
    <main className="font-sans w-full min-h-screen bg-gradient-to-br from-sky-500 to-indigo-600 flex flex-col items-center justify-center p-4 text-white">
      <div className="w-full max-w-md bg-black/20 backdrop-blur-md rounded-2xl shadow-lg p-6 md:p-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Clima no Mogi?</h1>

        <div className="mb-6">
          <div className="flex rounded-full bg-white/20 shadow-lg overflow-hidden">
            <input
              type="text"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder="Digite o nome da cidade..."
              className="w-full bg-transparent text-white placeholder-white/70 px-6 py-3 outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleConsultar()}
            />
            <button
              onClick={handleConsultar}
              disabled={isLoading}
              className="bg-sky-400 hover:bg-sky-500 transition-colors px-6 disabled:bg-sky-800 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Search className="w-6 h-6" />
              )}
            </button>
          </div>
          {error && <p className="text-red-300 text-sm mt-2">{error}</p>}
        </div>

        <p className="text-sm text-white/70 mb-6">
          {isConnected ? 'Conexão ao vivo' : 'Desconectado'}
        </p>

        {isLoading && (
          <div className="flex flex-col items-center text-white/80">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <p className="text-xl">Consultando...</p>
          </div>
        )}

        {!isLoading && data && (
          <div className="flex flex-col items-center">
            <div className="mb-4">
              <WeatherIcon icon={data.current.condition.icon} text={data.current.condition.text} />
            </div>
            <p className="text-6xl md:text-7xl font-extrabold tracking-tighter">
              {Math.round(data.current.temp_c)}&deg;C
            </p>
            <p className="text-xl capitalize text-white/90 mt-2">{data.location.name}</p>
            <p className="text-md text-white/80 mt-1">{data.current.condition.text}</p>

            <div className="flex justify-around w-full mt-6 pt-6 border-t border-white/20">
              <div className="text-center">
                <Droplets className="w-6 h-6 mx-auto text-white/80 mb-1" />
                <p className="text-lg font-bold">{data.current.humidity}%</p>
                <p className="text-xs text-white/70">Umidade</p>
              </div>
              <div className="text-center">
                <Wind className="w-6 h-6 mx-auto text-white/80 mb-1" />
                <p className="text-lg font-bold">{data.current.wind_kph} km/h</p>
                <p className="text-xs text-white/70">Vento</p>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !data && (
          <div className="flex flex-col items-center text-white/80">
            <div className="mb-4">
              <Cloud className="w-24 h-24" />
            </div>
            <p className="text-xl">Consulte uma cidade para ver o clima.</p>
          </div>
        )}
      </div>
    </main>
  );
}

