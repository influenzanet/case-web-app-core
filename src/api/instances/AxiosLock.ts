// https://medium.com/@sami_33286/locking-solution-for-axios-requests-255d196d3a2d

class AxiosLock {
  isLocked = false;
  promiseResolvers: Array<(value: unknown) => void> = [];

  lock = () => {
    this.isLocked = true;
  }

  unlock = () => {
    this.isLocked = false;
    this.promiseResolvers.forEach(resolve => resolve(null))
    this.promiseResolvers = []
  }

  timeout = (resolve: (value: unknown) => void) => setTimeout(() => {
    this.isLocked = false;
    resolve(null);
  }, 60000);// timeout after 1 min

  waitForUnlock = () => {
    return new Promise((resolve) => {
      this.promiseResolvers.push(resolve)
      this.timeout(resolve)
    });
  }
}

const axiosLock = new AxiosLock();

export default axiosLock;
