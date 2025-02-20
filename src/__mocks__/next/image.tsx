import React from 'react'

const NextImage = ({ src, alt, ...props }: any) => {
  return <img src={src} alt={alt} {...props} />
}

export default NextImage 