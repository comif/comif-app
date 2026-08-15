import { MailCheck } from 'lucide-react';

export default function VerifiezPage() {
  return (
    <div className="min-h-screen bg-[#F4F1EB] font-sans flex items-center justify-center p-6">
      <div className="max-w-sm w-full bg-white rounded-3xl border border-[#E8E4D9] shadow-xl p-8 relative overflow-hidden text-center">
        <div className="absolute top-0 left-0 right-0 h-2 bg-[#5A0A18]" />

        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-[#FCFAF5] rounded-full border border-[#E8E4D9] flex items-center justify-center">
            <MailCheck className="w-8 h-8 text-[#5A0A18]" />
          </div>
        </div>

        <h1 className="text-xl font-black text-stone-800 mb-2">Vérifiez votre boîte mail</h1>
        <p className="text-stone-500 font-medium text-sm">
          Si un compte existe avec cet email, un lien de connexion vient de vous être envoyé.
          Cliquez dessus pour accéder à votre compte.
        </p>
      </div>
    </div>
  );
}
