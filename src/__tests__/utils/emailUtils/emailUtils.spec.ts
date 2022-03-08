import {sendEmail} from "../../../utils/emailUtils";

describe('emailUtils', () => {
    it.skip('should send an email', async () => {
        //Given
        const to = 'mshulhin@gmail.com'
        const subject = 'Test!'
        const text = 'It is working!'
        const html = ''

        //When
        const result = await sendEmail(
            to,
            subject,
            text,
            html,
        )

        //Then
        expect(result['accepted']).toBe(["mshulhin@gmail.com"])
        expect(result['envelope']['from']).toBe(["admin@bloodbay.org"])
        expect(result['envelope']['to']).toBe(["mshulhin@gmail.com"])
    })
})
