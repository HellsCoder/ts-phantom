import * as CryptoJS from 'crypto-js';

/**
 * AESSecure шифрует битстрим, шифрование работает только когда bs представлен в виде строки
 */
export default class AESSecure {

    private key : string;
    private secure : boolean;

    constructor(key : string, secure : boolean){
        this.key = key;
        this.secure = secure;
    }

    /**
     * Определяет включено сейчас шифрование или нет
     * @returns включено шифрование или нет
     */
    public isSecured() : boolean {
        return this.secure;
    }

    /**
     * Шифрование байт строки bs
     * @param bytes байты строки bs
     * @returns aes crypted
     */
    public encode(bytes : string) : string {
        if(!this.secure){
            return bytes;
        }
        return CryptoJS.AES.encrypt(bytes, this.key).toString();
    }

    /**
     * Расшифровка строки bs
     * @param bytes байты строки bs
     * @returns aes decrypted
     */
    public decode(bytes : string){
        if(!this.secure){
            return bytes;
        }
        return CryptoJS.AES.decrypt(bytes, this.key).toString(CryptoJS.enc.Utf8);
    }


}