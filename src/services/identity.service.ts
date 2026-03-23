import { ContactRepository } from '../repositories/contact.repository';

export class IdentityService {
  private contactRepo: ContactRepository;

  constructor() {
    this.contactRepo = new ContactRepository();
  }

  async processIdentification(email?: string, phoneNumber?: string) {
    const existingContacts = await this.contactRepo.findMatches(
      email,
      phoneNumber
    );

    if (existingContacts.length === 0) {
      const newContact = await this.contactRepo.create({
        email,
        phoneNumber,
        linkPrecedence: 'primary',
        linkedId: null,
      });

      return {
        contact: {
          primaryContactId: newContact.id,
          emails: [newContact.email].filter(Boolean),
          phoneNumbers: [newContact.phoneNumber].filter(Boolean),
          secondaryContactIds: [],
        },
      };
    }

    return null;
  }
}
