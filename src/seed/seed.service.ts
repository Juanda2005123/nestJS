import { Injectable } from '@nestjs/common';
import { UserService } from '../users/user.service';
import { PropertyService } from '../properties/property.service';
import { TaskService } from '../tasks/task.service';
import { UserRole } from 'src/users/user.model';

@Injectable()
export class SeedService {
  constructor(
    private userService: UserService,
    private propertyService: PropertyService,
    private taskService: TaskService,
  ) {}

  async runSeed() {
    const usersByEmail = await this.seedUsers();
    const propertiesByKey = await this.seedProperties(usersByEmail);
    await this.seedTasks(usersByEmail, propertiesByKey);
  }

  private async seedUsers(): Promise<Map<string, string>> {
    const usersByEmail = new Map<string, string>();
    const users = [
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin1234',
        role: UserRole.SUPERADMIN,
      },
      {
        name: 'Agent User',
        email: 'agent@example.com',
        password: 'agent1234',
        role: UserRole.AGENT,
      },
      {
        name: 'Agent Lisa',
        email: 'agent.lisa@example.com',
        password: 'agentlisa1234',
        role: UserRole.AGENT,
      },
      {
        name: 'Agent Diego',
        email: 'agent.diego@example.com',
        password: 'agentdiego1234',
        role: UserRole.AGENT,
      },
      {
        name: 'juancano',
        email: 'juancanodevog@gmail.com',
        password: 'HablameloPrro69',
        role: UserRole.SUPERADMIN,
      },
    ];

    for (const user of users) {
      const existing = await this.userService.findByEmail(user.email, {
        includeDeleted: true,
      });

      if (!existing) {
        const created = await this.userService.create(user);
        usersByEmail.set(user.email, created.id);
      } else {
        if (existing.isDeleted) {
          await this.userService.restore(existing.id);
        }

        await this.userService.update(existing.id, {
          name: user.name,
          email: user.email,
          password: user.password,
          role: user.role,
        });

        usersByEmail.set(user.email, existing.id);
      }
    }

    return usersByEmail;
  }

  private async seedProperties(
    usersByEmail: Map<string, string>,
  ): Promise<Map<string, { id: string; ownerId: string }>> {
    const propertyMap = new Map<string, { id: string; ownerId: string }>();
    const propertyKey = (title: string, ownerId: string) =>
      `${title}|${ownerId}`;

    const existingProperties = await this.propertyService.listPublic();
    for (const property of existingProperties.properties) {
      if (property.ownerId) {
        propertyMap.set(propertyKey(property.title, property.ownerId), {
          id: property.id,
          ownerId: property.ownerId,
        });
      }
    }

    const propertySeeds = [
      {
        ownerEmail: 'agent@example.com',
        data: {
          title: 'Property One',
          description: 'Spacious family house with backyard.',
          price: 100000,
          location: 'City Center',
          bedrooms: 3,
          bathrooms: 2,
          area: 150,
          imageUrls: ['https://example.com/property-one.jpg'],
        },
      },
      {
        ownerEmail: 'agent@example.com',
        data: {
          title: 'Downtown Loft',
          description: 'Modern loft surrounded by restaurants and parks.',
          price: 185000,
          location: 'Downtown',
          bedrooms: 2,
          bathrooms: 1,
          area: 95,
          imageUrls: ['https://example.com/downtown-loft.jpg'],
        },
      },
      {
        ownerEmail: 'agent.lisa@example.com',
        data: {
          title: 'Lakeside Villa',
          description: 'Luxury villa with private dock and panoramic views.',
          price: 450000,
          location: 'Lake View',
          bedrooms: 5,
          bathrooms: 4,
          area: 320,
          imageUrls: ['https://example.com/lakeside-villa.jpg'],
        },
      },
      {
        ownerEmail: 'agent.diego@example.com',
        data: {
          title: 'Cozy Mountain Cabin',
          description: 'Rustic cabin ideal for weekend getaways.',
          price: 155000,
          location: 'Mountain Ridge',
          bedrooms: 2,
          bathrooms: 1,
          area: 110,
          imageUrls: ['https://example.com/mountain-cabin.jpg'],
        },
      },
    ];

    for (const seed of propertySeeds) {
      const ownerId = usersByEmail.get(seed.ownerEmail);
      if (!ownerId) {
        continue;
      }

      const key = propertyKey(seed.data.title, ownerId);
      if (propertyMap.has(key)) {
        continue;
      }

      const created = await this.propertyService.createForAgent(
        ownerId,
        seed.data,
      );
      propertyMap.set(key, { id: created.id, ownerId });
    }

    return propertyMap;
  }

  private async seedTasks(
    usersByEmail: Map<string, string>,
    propertiesByKey: Map<string, { id: string; ownerId: string }>,
  ) {
    const propertyKey = (title: string, ownerId: string) =>
      `${title}|${ownerId}`;
    const taskKey = (title: string, propertyId: string) =>
      `${title}|${propertyId}`;

    const existingTasks = await this.taskService.listForAdmin();
    const existingTaskKeys = new Set(
      existingTasks.tasks
        .filter((task) => task.propertyId)
        .map((task) => taskKey(task.title, task.propertyId as string)),
    );

    const taskSeeds = [
      {
        ownerEmail: 'agent@example.com',
        propertyTitle: 'Property One',
        tasks: [
          {
            title: 'Inspect property',
            description: 'Complete the initial walk-through and take notes.',
          },
          {
            title: 'Schedule photoshoot',
            description: 'Coordinate professional photography session.',
          },
        ],
      },
      {
        ownerEmail: 'agent@example.com',
        propertyTitle: 'Downtown Loft',
        tasks: [
          {
            title: 'Publish listing',
            description: 'Prepare the listing copy and publish to the portal.',
          },
        ],
      },
      {
        ownerEmail: 'agent.lisa@example.com',
        propertyTitle: 'Lakeside Villa',
        tasks: [
          {
            title: 'Plan open house',
            description: 'Set date, invitations, and catering for open house.',
          },
          {
            title: 'Follow-up with leads',
            description: 'Call potential buyers from last week list.',
          },
        ],
      },
      {
        ownerEmail: 'agent.diego@example.com',
        propertyTitle: 'Cozy Mountain Cabin',
        tasks: [
          {
            title: 'Check utilities',
            description: 'Verify water and heating systems before visits.',
          },
        ],
      },
    ];

    for (const seed of taskSeeds) {
      const ownerId = usersByEmail.get(seed.ownerEmail);
      if (!ownerId) {
        continue;
      }

      const property = propertiesByKey.get(
        propertyKey(seed.propertyTitle, ownerId),
      );
      if (!property) {
        continue;
      }

      for (const task of seed.tasks) {
        const key = taskKey(task.title, property.id);
        if (existingTaskKeys.has(key)) {
          continue;
        }

        await this.taskService.createForAgent(ownerId, {
          title: task.title,
          description: task.description,
          propertyId: property.id,
        });

        existingTaskKeys.add(key);
      }
    }
  }
}
