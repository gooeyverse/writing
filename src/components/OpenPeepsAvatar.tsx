import React from 'react';

interface OpenPeepsAvatarProps {
  variant: string;
  className?: string;
  size?: number;
}

export const OpenPeepsAvatar: React.FC<OpenPeepsAvatarProps> = ({ 
  variant, 
  className = '', 
  size = 48 
}) => {
  // OpenPeeps avatar configurations
  const avatarConfigs: Record<string, { 
    head: string; 
    face: string; 
    hair: string; 
    body: string; 
    accessory?: string;
    colors: {
      skin: string;
      hair: string;
      clothing: string;
      accent?: string;
    };
  }> = {
    'sophia': {
      head: 'head-front',
      face: 'eyes-wink-wacky',
      hair: 'hair-short-curly',
      body: 'bust-shirt-crew',
      accessory: 'accessory-glasses-round',
      colors: {
        skin: '#F4C2A1',
        hair: '#8B4513',
        clothing: '#2563EB',
        accent: '#1E40AF'
      }
    },
    'marcus': {
      head: 'head-front',
      face: 'eyes-happy',
      hair: 'hair-medium-straight',
      body: 'bust-shirt-crew',
      colors: {
        skin: '#D4A574',
        hair: '#4A4A4A',
        clothing: '#059669',
        accent: '#047857'
      }
    },
    'professor-chen': {
      head: 'head-front',
      face: 'eyes-glasses',
      hair: 'hair-short-straight',
      body: 'bust-shirt-crew',
      accessory: 'accessory-glasses-square',
      colors: {
        skin: '#E8B887',
        hair: '#2D2D2D',
        clothing: '#7C3AED',
        accent: '#6D28D9'
      }
    },
    'holden': {
      head: 'head-front',
      face: 'eyes-sleepy',
      hair: 'hair-medium-messy',
      body: 'bust-shirt-crew',
      colors: {
        skin: '#F2D2A9',
        hair: '#8B6914',
        clothing: '#DC2626',
        accent: '#B91C1C'
      }
    },
    'billy': {
      head: 'head-front',
      face: 'eyes-wink',
      hair: 'hair-short-messy',
      body: 'bust-shirt-crew',
      colors: {
        skin: '#E5C4A1',
        hair: '#654321',
        clothing: '#374151',
        accent: '#1F2937'
      }
    },
    'david': {
      head: 'head-front',
      face: 'eyes-happy',
      hair: 'hair-medium-wavy',
      body: 'bust-shirt-crew',
      colors: {
        skin: '#F4C2A1',
        hair: '#B8860B',
        clothing: '#EA580C',
        accent: '#C2410C'
      }
    },
    'default': {
      head: 'head-front',
      face: 'eyes-happy',
      hair: 'hair-short-straight',
      body: 'bust-shirt-crew',
      colors: {
        skin: '#F4C2A1',
        hair: '#8B4513',
        clothing: '#6B7280',
        accent: '#4B5563'
      }
    }
  };

  const config = avatarConfigs[variant] || avatarConfigs['default'];

  return (
    <div 
      className={`inline-flex items-center justify-center rounded-full bg-gray-100 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.8}
        height={size * 0.8}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Head/Face Base */}
        <circle
          cx="50"
          cy="45"
          r="25"
          fill={config.colors.skin}
          stroke="#E5E7EB"
          strokeWidth="1"
        />
        
        {/* Hair */}
        <path
          d="M25 35 Q50 15 75 35 Q75 25 50 20 Q25 25 25 35"
          fill={config.colors.hair}
          stroke="#D1D5DB"
          strokeWidth="0.5"
        />
        
        {/* Eyes */}
        <circle cx="42" cy="40" r="2" fill="#374151" />
        <circle cx="58" cy="40" r="2" fill="#374151" />
        
        {/* Glasses (if applicable) */}
        {config.accessory?.includes('glasses') && (
          <g stroke="#374151" strokeWidth="1.5" fill="none">
            <circle cx="42" cy="40" r="6" />
            <circle cx="58" cy="40" r="6" />
            <path d="M48 40 L52 40" />
          </g>
        )}
        
        {/* Nose */}
        <path d="M50 45 L48 48 L52 48 Z" fill={config.colors.skin} stroke="#D1D5DB" strokeWidth="0.5" />
        
        {/* Mouth */}
        <path d="M45 52 Q50 55 55 52" stroke="#374151" strokeWidth="1.5" fill="none" />
        
        {/* Body/Clothing */}
        <path
          d="M25 70 Q25 65 30 65 L70 65 Q75 65 75 70 L75 85 Q75 90 70 90 L30 90 Q25 90 25 85 Z"
          fill={config.colors.clothing}
          stroke="#D1D5DB"
          strokeWidth="1"
        />
        
        {/* Clothing Details */}
        <circle cx="50" cy="75" r="2" fill={config.colors.accent || config.colors.clothing} />
        <path d="M35 70 L35 85" stroke={config.colors.accent || '#FFFFFF'} strokeWidth="1" opacity="0.3" />
        <path d="M65 70 L65 85" stroke={config.colors.accent || '#FFFFFF'} strokeWidth="1" opacity="0.3" />
      </svg>
    </div>
  );
};