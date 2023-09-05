import logo from "./logo.svg";
import "./App.css";
import { useFetch, CreateCacheAsyncPlugin } from "./fetch-cache";
import { useEffect } from "react";

import {
  AppstoreOutlined,
  ContainerOutlined,
  DesktopOutlined,
  MailOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import { Button, Menu } from 'antd';

const getMenu = async () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({
        data: [
          {
            label: "菜单1",
            key: '1'
          },
          {
            label: "菜单2",
            key: '2'
          },
          {
            label: "菜单3",
            key: '3'
          },
        ],
      });
    }, 1000);
  })
};

function App() {
  const { data } = useFetch(
    {
      fetch: getMenu,
      cacheKey: 'react-menu-key',
      dataHandler: (data) => {
        return data?.data || []
      }
    }
  );
  console.log("data", data);

  // function getItem(label, key, icon, children, type) {
  //   return {
  //     key,
  //     icon,
  //     children,
  //     label,
  //     type,
  //   };
  // }

  // const items = [
  //   getItem('Option 1', '1', <PieChartOutlined />),
  //   getItem('Option 2', '2', <DesktopOutlined />),
  //   getItem('Option 3', '3', <ContainerOutlined />),
  //   getItem('Navigation One', 'sub1', <MailOutlined />, [
  //     getItem('Option 5', '5'),
  //     getItem('Option 6', '6'),
  //     getItem('Option 7', '7'),
  //     getItem('Option 8', '8'),
  //   ]),
  //   getItem('Navigation Two', 'sub2', <AppstoreOutlined />, [
  //     getItem('Option 9', '9'),
  //     getItem('Option 10', '10'),
  //     getItem('Submenu', 'sub3', null, [getItem('Option 11', '11'), getItem('Option 12', '12')]),
  //   ]),
  // ];

  return (
    <div className="">
      <div style={{width: '200px'}}>
      <Menu
        defaultSelectedKeys={['1']}
        defaultOpenKeys={['sub1']}
        mode="inline"
        items={data?.data || data}
      />
      </div>
    </div>
  );
}

export default App;
