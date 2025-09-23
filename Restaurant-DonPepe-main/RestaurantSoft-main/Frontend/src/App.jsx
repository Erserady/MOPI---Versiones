import AppRouter from "./router/AppRouter";
import "./styles/global_styles.css";

import { store } from "./redux/Store";

import { Provider } from "react-redux";

function App() {
  return (
    <Provider store={store}>
      <AppRouter></AppRouter>
    </Provider>
  );
}

export default App;
