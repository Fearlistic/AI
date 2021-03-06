import { rabbitMqService } from '@Services/amqp/rabbit-mq.service'

const purgedQueues: string[] = []

/**
 * Decorator used for delaying function calls certain time.
 * Time can be set with QUEUE_TIMEOUT env var.
 *
 * @author Karafra
 * @param queueName name of queue
 */
export function Queued(queueName: string) {
  return function (
    _target: any,
    _key: string,
    descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>
  ) {
    const method = descriptor.value as (...args: any[]) => any
    descriptor.value = async function (...args: any[]) {
      if (purgedQueues.indexOf(queueName) > -1) {
        await rabbitMqService.purgeQueue(queueName)
        purgedQueues.push(queueName)
      }
      await rabbitMqService.publishToQueue(queueName, args)
      const dequeuedArgs = await rabbitMqService.popFromQueue<any[]>(queueName)
      return method.apply(this, dequeuedArgs)
    }
    return descriptor
  }
}
