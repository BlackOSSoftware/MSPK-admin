import { useToastContext } from '../context/ToastContext';

const useToast = () => {
    return useToastContext();
};
export default useToast;
