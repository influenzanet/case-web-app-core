export const blurPhone = (phone: string): string => {
    if (phone.length < 4) {
      return '****';
    }
    return phone.slice(0, 2) + '****' + phone.slice(-2);
  }