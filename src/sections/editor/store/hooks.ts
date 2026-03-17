import type { RootState, AppDispatch } from 'src/state';

import { useDispatch, useSelector } from 'react-redux';

// ----------------------------------------------------------------------

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
