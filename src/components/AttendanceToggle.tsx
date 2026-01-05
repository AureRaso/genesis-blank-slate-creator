import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface AttendanceToggleProps {
  isAttending: boolean;
  onChange: (attending: boolean) => void;
  disabled?: boolean;
}

export const AttendanceToggle = ({ isAttending, onChange, disabled = false }: AttendanceToggleProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between gap-3 w-full">
      {/* Status message - ahora a la izquierda */}
      <div className={`text-xs font-semibold flex items-center gap-1.5 ${
        isAttending ? 'text-green-700' : 'text-red-700'
      }`}>
        {isAttending ? (
          <>
            <Check className="h-3.5 w-3.5" />
            <span>{t('playerDashboard.attendance.confirmed')}</span>
          </>
        ) : (
          <>
            <X className="h-3.5 w-3.5" />
            <span>{t('playerDashboard.attendance.notAttending')}</span>
          </>
        )}
      </div>

      {/* Toggle Container - ancho aumentado para textos largos en otros idiomas */}
      <div className="relative w-52">
        {/* Background track */}
        <div
          className={`relative h-10 rounded-full cursor-pointer transition-colors duration-300 ${
            isAttending
              ? 'bg-gradient-to-r from-green-500 to-green-400'
              : 'bg-gradient-to-r from-red-400 to-red-500'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => !disabled && onChange(!isAttending)}
        >
          {/* Labels - texto más pequeño para acomodar traducciones más largas */}
          <div className="absolute inset-0 flex items-center justify-between px-3 text-white font-semibold text-[11px] pointer-events-none">
            <div className={`flex items-center gap-1 transition-opacity ${isAttending ? 'opacity-100' : 'opacity-40'}`}>
              <Check className="h-3.5 w-3.5" />
              <span>{t('playerDashboard.attendance.going')}</span>
            </div>
            <div className={`flex items-center gap-1 transition-opacity ${!isAttending ? 'opacity-100' : 'opacity-40'}`}>
              <span>{t('playerDashboard.attendance.notGoing')}</span>
              <X className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Animated slider */}
          <motion.div
            className="absolute top-0.5 bottom-0.5 w-[calc(50%-4px)] bg-white rounded-full shadow-lg flex items-center justify-center"
            initial={false}
            animate={{
              left: isAttending ? '2px' : 'calc(50% + 2px)',
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
          >
            {isAttending ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <X className="h-5 w-5 text-red-500" />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
