
import React from 'react';

export const Disclaimer: React.FC = () => {
  return (
    <div className="bg-slate-100 border-t border-slate-200 p-3 text-[10px] text-slate-500 text-center no-print">
      <p>⚖️ Information juridique non contractuelle. Consultez un avocat.</p>
      <p className="font-arabic mt-1">هذه المعلومات قانونية عامة ولا تعتبر استشارة قانونية خاصة</p>
    </div>
  );
};
