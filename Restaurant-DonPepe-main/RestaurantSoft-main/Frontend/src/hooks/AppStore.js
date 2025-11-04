import { useDispatch, useSelector } from "react-redux";

export const useDispatchApp = () => useDispatch();
export const useSelectorApp = (selector) => useSelector(selector);
