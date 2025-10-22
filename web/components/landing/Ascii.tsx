'use client'

import { useState, useEffect } from 'react'

const Ascii = () => {
  const [visibleChars, setVisibleChars] = useState(0)
  const [isAnimating, setIsAnimating] = useState(true)

  const asciiArtText = `

     ,11111111i;,
     .;::,,,;i1ttttt1;,
      ::,.....,,,::;1ttt11;,
      ...            ..,:i1tttti:
                          .,:;1tttffttft1tfLLLfLft1;
                            ;fLtt111i:,.,::;1fLLLLLLLLCLLt;
     .,                   .1tttt1i;,          .;i111i11ifLCLLLL1
     ,i;.                .;i1tt11i;.              .,::::;itfLLLCLCL;
     ,11t1;              ;;1ttf1t1i:                     .:i;ii1fffLLCCfi
     ,ttfLff1:          ,,:iiitf1t1i;                      ...:;i;;1ffLCCCCCLLft1;,
      ;1tfLLfLLft11i;.     ,;:,;1tti;:                         :,;;;i1t1LCLCCCCtttf1ift
     :Lff1i;:;;;;;;;it1ti;;1tt;,.,:i11i;                         ..,.i;i1fLLffffff  i   i
      ::.           . ..;ii1i. :;;  .,,;1ffttttt1ii;               :i,:1:;itt;i11Lf:...;;,;
                            ,:.   :t1i;;1iff1tf1LLffff1;                    ,,,:,,itLLLt1,,;
                                     .iti:;1111fLtittt111i:
                :;tLt;                   ,1tLLfCLCLCCCLLft1;;.
                ,;iLLtf:                          . :;ii;1tftLL1.    i1,
                 ,;1LL1;.      :                               ,;11.   ;t1.
                 .:ff1:i.       .1.                              .,:i     ;ff1.
                 .;iLttt1         .t.                            .. ,::,     .;1tt;.
                 .i1CLti1,.,:1f1   .:i                           . .,:,:i;       .:itLf1.
                 ,;;11:iii::;fLCL;  .i1,                              ;1tffCffffii: ,;1tfLLfi
     :t          ,:ii11;fiii;1f1tt1. .iLf,    ..,:;;i;,           .LLLCffLtftffCCLGCGf;.,:;;i1ff;
      :i1t       ,..,:.i:i111i;1Lti:. 1fLfi.,:i111tfiii:::,,   iCLLLt1;:.    ,::fLGCGCCLLi     .:;;,
      ;t11:,1:      :.,.;ttLfLtf1iti::iitt1i:;1Ltttf1i;::;:,;LLLti;,..           ,:fLCLCffLi       ,;i.
           ...:::   ..i,ii1t1fftf11,i,,,;1;1i;;iLfttt1;:..iCLftL1t: .               :;;1i1iii: ,ii.  ,;1;
                ;.;   ,:;iif;ftL1t;,,   ,.;1if11LCLLLfi:,1fLfLLtL1;.                   .:i1,;;i..,::  .:it;
                  ...   ii1t1ffCLtii:    .:1LLLft1ffLLftfLLfCCCfff;:                       ,::;i, ..,   ,;i1:
                        .,i;1if1Lft:1;     ;;11tLttLLfLfLCCCCCC1tfL;.                          :i;. ..    ,:;i:
                       ,::;:1i1f1t1ti;,     ..,i,tftfLLLCCfGCLfL1f1;                          ,:;;i, ..     .,;i:
                        :,;;,;1t1ffitiif;      , ;,, 1tCtLCCLCfC1ff,,          .                 ;1fi;.       .,:;:.
                            .;1fLfL1ft:;LLf1;       it11iLLCtLt:L1i .;it1titii;                  ,:t1tLi         ,;ii:
                           . itCCLf11::::tfLtLff:. :;tt1;tft1CL;f1;,.ittfLtCftLL1fLL:             .;ii11f:        .:;i;
                            :1fLtLC;t11 .;i111fCt:tft1tL1tCtCLCt1:,.;Lf1:;ttL1iLtiLCCCiCLii          ,;:;ti;        ,:ii:
                           ;tLLf,tL1ii...,;ititCLLff1tt1tfCL1LL;;:.,:t1::,:;::;;:1ii;;1ttLLiGf.         ,,1111.      ,:;ii,
                        itLfGf,11LCfti:i .:1f1;iffff1i1t11ffLf1;:....:.,:,.: .   ....,::;;1ff1f1Cf        , 1fLLi    .:;itt:
                    ifffLLLifLif1;1;,::  :i:1,,:fftL;f1ft1fC1i:;..                      ,. .;ti:11Lffi.      ,:i1t1.  ,iii11;
             ,1:ttfC,i1fCLCCf;:,1;  :  ,  .. ,  1ffCt,:LtiiL1;:,                      .      ,  :fiitfiLf       :;;:t;.,;i1111,
     ,1tif1fftt;i1iiitL;:;,,,:.....         . .tffft1f;,i1;ti:,,                              ...::i;111itt,        .:i;::iii11i
     .1111iiii;,,tfit1;.  .:                  ;ff1tCCCitLtf;i::                                    i.:i1; ,1Li        .,:;i1tt1tt;
      :.;ii;;;ii....                         .1CffLLfftLLi1i :                                      .;:1;. i;tff          ,iiiii1ft.
       i. ;     1i:                          ftLftfCLLLtf1i;,,.        .,;i;:: ..                      .,,,,:ft;fi.        .:;;1itLt:
                                           ,LCCttt:fLtLt::: ,       ;i11LCGCLftf11tt1;.                   ,:.,,ii1fi:        .,;1tfff;
                                        LCLG;;t;ti11t1;;..,       .;tLLCCGGGGGGCGGCt1i11ti:.                  .Ct;1;tt,      . :ifLfff1
                                  ,,LLtGtfL11Cf1i;,:. ..         .:;fLCLCGGCCLCGCGGGCLfttfff1;;.              ..:i;11i;tf:     :i1LCLff1
                           :ifLCfffCtC1i;L;tfti it. .            ;;tLLLCfLGCCCGGCCGGGGGGGCLCt1Ltt;,              ;;., ;fLtL;  ,:fLLCLCLfi
     ;LLLf:.            .,itt1ft1ff1t111;:i;,                     :t1;1tLCCtCCCCCGGGGGGGGCGGCLLCCLfti.             ,:,:,:;iti1ttftfCCCCCf;
     ;CGCf1iL1;        . ;t ;;11i i; ..,  .                    .1.   tfL;tC0LfCCfCGGGGCGGLCGGGLLCCLCLt1.                 :;:;;fLLLLCCGGGLt,
     itttffGiCLLCt     .    .:  .  :                          ,;;tfft  1CGGCGGGGCGLLCCLfLLLCCCLCCCCCLLLfi.                 ,.,;1111ffLCCf1;
     ,t fLLtGCCGGGCGi                                        ,i1tCLLfLG ,CGLCLLCttCGLLCGLLfLLLCLCCLLLLffft;                      .:tf11tii;
      ;1:;iLtfGfGL1f1t,                                     :itCCLCCGGCti, .,::1tfffLLCGCGGLLCCLfLLLLLffffti,                     ....:i;:
      .i1;:i;  ;iCCGGLLt                                  .:ifLCCLLGGGCCGGLff,, :;.   ::LCGGCCLf1LLtLLLttftt1;
      .,.::,,11;Lt;:1Ct1t;                              .,.,.,:CCGCGGCGGCGGLLLft1iifLiii.  ,,itttt1tttfffffft1i.
        ,:.  i:;;;L. iCGfLf:                          :iiffLCLC,.CGGGGGGGLLLfLLLLCCLffLfCL1Li   ,itt11ttftfff1ti,
           ..  :, ,i;;1Lt1iit                      ,;ittfttfLCCf1,tfLtii;:ift11f1ftLLLLftLf1i;;;,   fft1tfftfft11;
          ,;,.,. , ,:L:;;,.:.i                 .,;i1ttf1: ., ...,     ,        , . .1ffffffff11t,,;;  11titi11ii1i;
        .   :,   .;,,::i1ti1fLfi            .,:;;::                                 .;t:1ftttff1tt1i;  :1111ttffft;i
          . : .   :;     :L1LLf1f:      .,,:;i::       :,.. ...                         ,ittttL11tti;;;  :;111tftft1,
               , .;    .:1tfLL:CCft.  .,:,,     ::iii1ii;:,..                           :1iitfLft1i1:::   ,....,.,;,,:
                  : , . if111tLLfCftt,:::  .ii;iii;;;:;:.                               .:;it1tLti;::,,.          .
                   . ,  ;:;1.,fCLit1:i,    .,::;.::,.                                    .,i111ft11:,,
                   :   . .i:,..1fLtfL1i;:,,.,:, ..         .,,,,                          .;1ttLf11i,
                        .   , ,11Lf;1i1;i...           ,;fLLCLfLt1;,.                      ,ifLLLLf1;                   .
                        ..,,i:;i:itLtft;;:           .i1fLfLftfftft1i;.                    .;fCGGttLt                    ,.
                         ..ti.,1ttt . ;,. ,        .,;iii1;;;;;:;:;;i;,.                   :iff;.LGLti                   .,
                          ,iii:1;if;;11ii1;i      ...:::,.,::ii1i111i;,.                 .,.   ,fGGGGGG          .,:,,
                          ,:;iit,;:ff;;   1:i    ....,:;i1itttfLftfff1i:,               .   ;1ttfLCGGGG0C.   .:;iiii;i1;
                            :,;i1;;:1;:,.,:,;;    ..,:,,::;;:::;:;ii;:,.             ..   ,ii11ffLLfLCG00GG. .,,,:;;;;;i;
                             ,,:,. .tiffLf11;;.                                   ...    ,;111tfLftLfLLGG0GGL;,::;;;:::,:.
                              .:;,:i1i,.;;1;,;;                               .:::,,   ,;iitt11fffttttfLCCLfLLt::;;;;;;;:,         ..
                                     :,1i;1i  .                              ..  .  .;;1fftffti1fft1t1fLLGCGCGGGt    ,;i1;
      .                        ..,,i,;;ii;;: ,,,                       . .,:i11,..tfffftfffLLftft111ff1LLLCCCG0GG00C.     .         .
     ,:.,                       ;;,   1.1ii::.,;,::;;;::,. .     ..:;;i111it. iffLfffLLLLLfLL1tt1i;ii,:tLCGG00GGGGGGGGCf             .
     ;fi:,:                   :.;;,:..i.:;,,,,.,11ttffftt: ii1i1t1tftffLCLL ffLCCLLCCCCCfttft1f111i1ftfCCLLti:1i1ttLLLft1
     .:tfiiti:               :1f:;f:i;;,  : ..,:1ttfLLLfLL  LLLCCCCCCCCLLi,LLCCGLCLGCCGLffLfLfffttt1fLLLf:,,     .,:i;::,              ..
     .tfiifL1i1f:          ,ttL11i;...:    . ..;i1tftfLLLLC,,fCCGCLGCGGLii1LLCCCCCGCCGCLCCLftt1i;f1CLft;.,                            . .
     ,tt:;fttfL1,ifffffCLL1fLfttt, ,t ;,       ::i1tfCfLfCGt 1GCGGGGC1LGCGLCGCGLLCGCLCLCLLft1::1LLLfti:,.                             ..
     ,itt1t1ft11i1tff1tfL11f1;;;                .::;ttffi;      .   .  ,LLLGCCGGGCLCCLfttii,,;iffff1;;,                  ,;.          ....
     :1;LtLL1fi::it,tLL:tft,    ; .   .         .,,,:;;;1  ;LLCLLL1;iit ;LfCCGCGLCCGLLfL1i;:ii:it1;:,.                  .Cft;           ..
      1tti;ii:;i;;:1;,:i ,,.,..:..              ,,:;11tf1 :tffffLt1tLt11 ,CGCCCLLLLLfLLLLtiii;,,;:,                     tfffff:
     .;;,i :iit,t1;:. :i :                      ,:ii,;fL  tLLfffLLLLfLC1:.CfffCCCCLfLtLLLLt:,.                          LLLffft1
      ,,:.;;.;;;,: .;. ;:  . .                 ..:;;:   .1tfLffLffffLLLtf, iLLLfLLLft11ftii;.                          :LfttfLLt1
           .,:. ;                              ..:;i  .iff1ittt1ffttLfL1fL, fLfLLfLLCLLffLftt;           .            .ttttttffttt
                                                     .:ttt1it111ittftt11t1i  ff1tfLLLCCCCLLfCLL1:.  ,,:::;:          ;tt11ttttt11ii
                                                   ;,  ;i1i:111t11it1t1itft1: i111LCCLCCfffLCLCGCLfffffttt1i,        ;1t11i1tt1t11i,
                                                        ,;iti11;1i1tt1ttffLt1i. ,1ffLLCGGCfCCCCGGCGGCCCLCCCCL1,..,:. ,i11t111tti1i;,
                                                    ..  ,;ii;i;111;i11tffLftfLLC  ;LLLGGCCLCCLGLCCGCGGCGGGCt1i1ii;;;1ii1t111111i;;;.
                                                   ..,   ::::;i1;i1i11fftt11fLL1;     ,LCLCfLLCCCCLCGCCt;. .   .,.  .,,itt1t111;i;:
                                               . ..,,,..  .:::iii1i1ttfffffLLfLCCL1,i.;GfLCfffLCLCGCf;                  .itt1i1ii;.
                                               ... .         ,;:;ii111titff1LtLLLLLi:; :LLLLLLCCLfi.                      itt11i;;
                                               ....,... .,.  ,ii1111i1t1tt1iffftLftti,  ;tLLttft:                          i11ii:,
        .                                      ..   ...   .   :.111:iit11111ii1t1tfffii;  i;i:.                             i1ii;,.
      ..,.                                      ... ....  :,.   ,;;:i1i1i1t1:ii;ii1i1ttt,                                    ii;:,.
      . ,.                                       ..... .,..:,.    ,:iii:;itt1i1i1iiit1i:,           .:tLLfiLt1, , ..         .;i:.
      ..                                      .   ..,..,,,,,,,   .,::;;i:;1ti;1111i;;,.        .,;tiCLCCLLfLtLifi1;iLi;;,     ,::
      ,.                                   .  .........;:.,.:; ,:;:;;;;;;;i111ttt1i,,.      ,i1t1;iii;,,. .     ,. :,. ,::,    :,
      ;.                                   ...,:,.,,,::;::;:i;;  ::;ii:::;i1111111;:;,,;fCCLfi;::;i::,,,                   .   ,,
                                          ......,:,::::::;;;;;;;  .:;;::,::;;ii1i;:;,;itfttii11;:.                         .,.,,.
                                          . .....,..,:::;;;iii;i:  ::;i::,::;:;i;::,:;iittti11iii:,                          ii,
                                             ..::,,,:,:;i:;::i;;;  ,:;i;ii;iii;1,,,,,:ii;;:i1i;;:,.                          :;,
                                          .. .,;::.,:,;,:;;;;iii;. .::;:ii;;ii;;:::,:,,;:;:ii;,: .                           ,:,
                                        ,,,,..,,,:;,,::;::;;i;;,;:,  ::;:;:;::::;:;:::;:;i;iii;::,::;:;::;;;,,,..            .,.
                                         .....,.,,:::.,,:;::::;:;;;, ;;ii;;;;,;:;;;1:,:1t1i1ti;iitfftfLLLLLCLLf1t111;: ,:,...,..
                                      .. ,..  ,...,::.,:;;,,;;;;;;i:  .1ii;:..,;ii;1;;;i;11f11it1tLfCLCGGGGGGGCLLLLCLtt,11;::,.
                                      .. ...,,,...::,.,::,::;;;ii;:              :;i;1i;;;1ffftf1LCLLLCGGCGGCLLLLLCCLLf1ittti:.
                                      .   . ...,,,..,,,,,,,,;;;;;.  ...    ;:,,,.    :ii:;;tffttLLLCCCCCCLLfLffLLfffffL1 tf1i;,
                                       .   .... .,...,..,,,,::;:.   .,,,:.:,ii;ii:;i. .:iittttfLfffLLfftttftt1it1tt1ttt1,:ttt1:
                                               ..... ..,...,,.      .,,,,.,:;;1;1iiii.  ;::,itfft1t11i111iiii::i;ii;iiii:,;11i:
                                                 ... . .... .      ..,:,,,,:;;;;1ii1ii:   ,:;1t11i;:,,;:;,:;,,:::,,:::::,;..;;;
                                                        .....    ,:,,,;:::.;;:;;;i;iii1i;   .i1i;;;.,..,.,            .. ., ,::
                                                           .    .,,:,,,:,,:,::::i;:i;;;ii:   ,;:i:,,..                       ..
                                                                  ...,,,,,.,.,,::::;:::::,
      ., .                                                              .... ....,.,.. ...
      :::,,:.
      ,,;,;1,..
      :.;;itfii .
      ,,;:ii;:;, .
      , ,.;:  .;.i.                                                                                                ....
       , ,: 1;i t;,.                                                                                              ...,:,
       , ,;::itffi;;                                                                                              .,,:::,
       ..,;.i1Lffi1;.                                                                                             .,:;;;;,
        ,;;i;;it;:i:                                                                                              .,::;;;:
       ,.,;1;,;i1it;:, .                                                                                          .:;;;;:,
        .,     ;i1f.1,, .                                                                                        .,:;;:,..
           ;f1tf     .,                                                                                        .,,:;:,,,
         ,,i;t;i1;1i:                                                                                         .,,,,,,,..
        .;i:;:;1;i,:,,,,.                                                                                     ..... .
        .,,i;;:1i.,,.,,,                                                                                                                           `

  // Split text into lines to process each line separately
  const lines = asciiArtText.split('\n')
  const totalChars = asciiArtText.length

  useEffect(() => {
    if (!isAnimating) return

    const interval = setInterval(() => {
      setVisibleChars(prev => {
        if (prev >= totalChars) {
          setIsAnimating(false)
          return totalChars
        }
        return prev + Math.floor(Math.random() * 45) + 15 // Lightning fast 30x speed
      })
    }, 1) // Ultra fast 1ms intervals

    return () => clearInterval(interval)
  }, [totalChars, isAnimating])

  // Create visible text by revealing characters progressively
  const getVisibleText = () => {
    let charCount = 0
    return lines.map((line, lineIndex) => {
      const lineLength = line.length + 1 // +1 for newline character
      const lineStart = charCount
      charCount += lineLength

      if (visibleChars <= lineStart) {
        return '' // Line hasn't started appearing yet
      } else if (visibleChars >= lineStart + lineLength) {
        return line // Full line is visible
      } else {
        // Partially visible line
        const visibleInLine = visibleChars - lineStart
        return line.substring(0, visibleInLine)
      }
    }).join('\n')
  }

  return (
    <div className="relative">
      <pre className="text-xs leading-none select-none">
        <span className="opacity-0">{asciiArtText}</span>
        <span
          className="absolute top-0 left-0 text-amber-600/70 animate-pulse"
          style={{
            textShadow: '0 0 10px rgba(245, 158, 11, 0.5)',
            fontFamily: 'monospace',
            whiteSpace: 'pre'
          }}
        >
          {getVisibleText()}
        </span>
      </pre>

      {/* Mystical glow effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(245, 158, 11, 0.1) 0%, transparent 70%)',
          animation: 'pulse 3s ease-in-out infinite'
        }}
      />

      {/* Animated cursor/glow at the end of visible text */}
      {isAnimating && (
        <div
          className="absolute w-1 h-3 bg-amber-400 animate-pulse"
          style={{
            boxShadow: '0 0 15px rgba(245, 158, 11, 0.8)',
            animation: 'blink 0.8s infinite'
          }}
        />
      )}
    </div>
  )
}

export default Ascii