// import { supabase, WaitlistEntry } from './supabase'

// export class WaitlistService {
//   static async addToWaitlist(data: {
//     name: string
//     email: string
//     type: 'waitlist' | 'download'
//   }): Promise<{ success: boolean; error?: string; data?: WaitlistEntry }> {
//     try {
//       const { data: result, error } = await supabase
//         .from('waitlist')
//         .insert([data])
//         .select()
//         .single()

//       if (error) {
//         // Handle duplicate email error
//         if (error.code === '23505') {
//           return {
//             success: false,
//             error: 'This email is already registered!'
//           }
//         }
//         return {
//           success: false,
//           error: error.message
//         }
//       }

//       return {
//         success: true,
//         data: result
//       }
//     } catch (error) {
//       return {
//         success: false,
//         error: 'An unexpected error occurred. Please try again.'
//       }
//     }
//   }

//   static async checkEmailExists(email: string): Promise<boolean> {
//     try {
//       const { data, error } = await supabase
//         .from('waitlist')
//         .select('id')
//         .eq('email', email)
//         .maybeSingle()

//       if (error) {
//         console.error('Error checking email:', error)
//         return false
//       }

//       return !!data
//     } catch (error) {
//       console.error('Error checking email:', error)
//       return false
//     }
//   }

//   static async getWaitlistStats(): Promise<{
//     total: number
//     downloads: number
//     waitlist: number
//   }> {
//     try {
//       const { data, error } = await supabase
//         .from('waitlist')
//         .select('type')

//       if (error) {
//         console.error('Error getting stats:', error)
//         return { total: 0, downloads: 0, waitlist: 0 }
//       }

//       const stats = {
//         total: data.length,
//         downloads: data.filter(item => item.type === 'download').length,
//         waitlist: data.filter(item => item.type === 'waitlist').length
//       }

//       return stats
//     } catch (error) {
//       console.error('Error getting stats:', error)
//       return { total: 0, downloads: 0, waitlist: 0 }
//     }
//   }
// }