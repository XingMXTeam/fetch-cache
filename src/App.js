import logo from "./logo.svg";
import "./App.css";
import fetchCache, { CreateCacheAsyncPlugin } from "./fetch-cache";
import { useEffect } from "react";

const getMenu = async () => {
  return [];
};

function App() {
  useEffect(() => {
    const { data } = fetchCache(
      getMenu,
      {
        retryCount: 5,
        manual: false,
      },
      [
        CreateCacheAsyncPlugin({
          getCacheKey: () => "layout-menu",
          timeout: 10000,
          adapter(_data) {
            if (!_data) {
              return undefined;
            }
            return { menus: _data.menus || [] };
          },
        }),
      ]
    );
    console.log('data', data);
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
