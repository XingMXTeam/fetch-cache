import "./App.css";
import { useFetch } from "./fetch-cache";
import { useState, useEffect } from "react";
import { Menu } from "antd";

const getMenu = async () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({
        data: [
          {
            label: "菜单1",
            key: "1",
          },
          {
            label: "菜单2",
            key: "2",
          },
          {
            label: "菜单3",
            key: "3",
          },
        ],
      });
    }, 1000);
  });
};

function App() {
  const [key, setKey] = useState();

  const defaultKey = new URL(window.location.href).searchParams.get("key");
  useEffect(() => {
    setKey(defaultKey);
  }, [defaultKey]);

  const { data } = useFetch({
    fetch: getMenu,
    cacheKey: "react-menu-key",
    dataHandler: (data) => {
      return data?.data || [];
    },
  });

  return (
    <div className="">
      <div style={{ width: "200px" }}>
        <ul>
          {(data?.data || data).map((i) => {
            console.log('i.key', i.key, key, i.key === key);
            return (
              <li
                style={{ color: i.key === key ? "red" : "black" }}
                key={i.value}
                onClick={() => {
                  setKey(i.key);
                  const cur = new URL(window.location.href);
                  cur.searchParams.set("key", i.key);
                  window.location.href = cur.href;
                }}
              >
                {i.label}
              </li>
            );
          })}
        </ul>
        {/* <Menu
          selectedKeys={[key]}
          mode="inline"
          items={data?.data || data}
          onClick={(v) => {
            setKey(v.key);
            const cur = new URL(window.location.href)
            cur.searchParams.set('key', v.key)
            window.location.href = cur.href;
          }}
        /> */}
      </div>
    </div>
  );
}

export default App;
