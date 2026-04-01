import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type Step = "phone" | "otp";

export default function Login() {
  const { sendOtp, verifyOtp } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // Auto-focus first OTP cell
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 0) return "";
    if (digits.startsWith("7") || digits.startsWith("8")) {
      const d = digits.startsWith("8") ? "7" + digits.slice(1) : digits;
      const parts = [
        "+7",
        d.slice(1, 4) ? ` (${d.slice(1, 4)}` : "",
        d.length > 4 ? `) ${d.slice(4, 7)}` : "",
        d.length > 7 ? `-${d.slice(7, 9)}` : "",
        d.length > 9 ? `-${d.slice(9, 11)}` : "",
      ];
      return parts.join("");
    }
    return "+" + digits;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setPhone(formatPhone(raw));
  };

  const handleSendOtp = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      toast({ title: "Введите корректный номер телефона", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const result = await sendOtp("+" + digits);
      setStep("otp");
      setOtp(["", "", "", "", "", ""]);
      setResendTimer(60);
      if (result.devCode) {
        toast({ title: `Код: ${result.devCode}`, description: "Это тестовый режим" });
      }
    } catch (e: unknown) {
      toast({
        title: "Ошибка",
        description: e instanceof Error ? e.message : "Не удалось отправить код",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (digit && index === 5) {
      const fullCode = [...newOtp.slice(0, 5), digit].join("");
      if (fullCode.length === 6) {
        handleVerifyOtp([...newOtp.slice(0, 5), digit]);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length > 0) {
      const newOtp = pasted.split("").concat(Array(6).fill("")).slice(0, 6);
      setOtp(newOtp);
      const lastIdx = Math.min(pasted.length - 1, 5);
      otpRefs.current[lastIdx]?.focus();
      if (pasted.length === 6) {
        handleVerifyOtp(newOtp);
      }
    }
  };

  const handleVerifyOtp = async (digits?: string[]) => {
    const code = (digits || otp).join("");
    if (code.length !== 6) {
      toast({ title: "Введите 6-значный код", variant: "destructive" });
      return;
    }
    const phoneDigits = phone.replace(/\D/g, "");
    setLoading(true);
    try {
      await verifyOtp("+" + phoneDigits, code);
    } catch (e: unknown) {
      toast({
        title: "Неверный код",
        description: e instanceof Error ? e.message : "Попробуйте снова",
        variant: "destructive",
      });
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#17212b]">
      <div className="w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-[#2ca5e0] flex items-center justify-center mb-4 shadow-lg">
            <svg viewBox="0 0 24 24" fill="white" className="w-10 h-10">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.68 7.93c-.12.56-.48.7-.97.43l-2.69-1.98-1.3 1.25c-.14.14-.27.27-.55.27l.19-2.73 4.99-4.5c.22-.19-.05-.3-.34-.11L7.16 14.26l-2.63-.82c-.57-.18-.58-.57.12-.84l10.27-3.96c.48-.17.9.12.72.16z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white">Telegram</h1>
          <p className="text-[#8899a6] text-sm mt-1">
            {step === "phone" ? "Введите ваш номер телефона" : "Введите код из СМС"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#1e2936] rounded-2xl p-6 shadow-xl">
          {step === "phone" ? (
            <>
              <p className="text-[#8899a6] text-sm text-center mb-4">
                Укажите ваш номер телефона и мы отправим вам код подтверждения
              </p>
              <Input
                type="tel"
                placeholder="+7 (999) 999-99-99"
                value={phone}
                onChange={handlePhoneChange}
                onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                className="bg-[#17212b] border-[#2a3a4a] text-white placeholder:text-[#8899a6] focus:border-[#2ca5e0] text-center text-lg h-12 rounded-xl"
                disabled={loading}
                autoFocus
              />
              <Button
                onClick={handleSendOtp}
                disabled={loading || phone.replace(/\D/g, "").length < 10}
                className="w-full mt-4 h-12 bg-[#2ca5e0] hover:bg-[#2895cc] text-white font-medium rounded-xl transition-colors"
              >
                {loading ? "Отправка..." : "Получить код"}
              </Button>
            </>
          ) : (
            <>
              <p className="text-white text-center mb-1 font-medium">{phone}</p>
              <p className="text-[#8899a6] text-sm text-center mb-5">
                Мы отправили вам код подтверждения
              </p>

              {/* OTP Input */}
              <div className="flex gap-2 justify-center mb-5" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    disabled={loading}
                    className={`w-10 h-12 text-center text-xl font-semibold rounded-xl border outline-none transition-all
                      bg-[#17212b] text-white
                      ${digit ? "border-[#2ca5e0]" : "border-[#2a3a4a]"}
                      focus:border-[#2ca5e0] focus:ring-2 focus:ring-[#2ca5e0]/20
                      disabled:opacity-50`}
                  />
                ))}
              </div>

              <Button
                onClick={() => handleVerifyOtp()}
                disabled={loading || otp.join("").length !== 6}
                className="w-full h-12 bg-[#2ca5e0] hover:bg-[#2895cc] text-white font-medium rounded-xl transition-colors"
              >
                {loading ? "Проверка..." : "Войти"}
              </Button>

              {/* Resend */}
              <div className="mt-4 text-center">
                {resendTimer > 0 ? (
                  <p className="text-[#8899a6] text-sm">
                    Отправить снова через {resendTimer} сек
                  </p>
                ) : (
                  <button
                    onClick={() => {
                      setStep("phone");
                      setOtp(["", "", "", "", "", ""]);
                    }}
                    className="text-[#2ca5e0] text-sm hover:underline"
                  >
                    Изменить номер или отправить снова
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
