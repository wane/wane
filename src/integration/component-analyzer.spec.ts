import {
  get01Factories,
  get02Factories,
  get03Factories,
  get04Factories,
  get05Factories,
} from './factory-analyzer.spec'
import { ComponentFactoryAnalyzer } from '../compiler/analyzer/factory-analyzer/component-factory-analyzer'

describe(`ComponentAnalyzer`, () => {


  describe(`getNamesOfRequiredInputs`, () => {

    const getRequiredInputs = (cfa: ComponentFactoryAnalyzer) => {
      return [...cfa.componentAnalyzer.getNamesOfRequiredInputs()]
    }

    describe(`in 01-hello-world`, () => {
      const fas = get01Factories()
      describe(`App component`, () => {
        it(`has no required inputs`, () => {
          expect(getRequiredInputs(fas.app)).toEqual([])
        })
      })
    })

    describe(`in 02-counter`, () => {
      const fas = get02Factories()
      describe(`App component`, () => {
        it(`has no required inputs`, () => {
          expect(getRequiredInputs(fas.app)).toEqual([])
        })
      })
      describe(`Counter component`, () => {
        it(`has a required input "value"`, () => {
          expect(getRequiredInputs(fas.counterCmp)).toEqual(['value'])
        })
      })
    })

    describe(`in 03-toggler`, () => {
      const fas = get03Factories()
      describe(`for App component`, () => {
        it(`has no required inputs`, () => {
          expect(getRequiredInputs(fas.app)).toEqual([])
        })
      })
      describe(`for Toggle`, () => {
        it(`has a required input`, () => {
          expect(getRequiredInputs(fas.toggleCmp)).toEqual(['value'])
        })
      })
    })

    describe(`in 04-comparator`, () => {
      const fas = get04Factories()
      describe(`for App component`, () => {
        it(`has no required inputs`, () => {
          expect(getRequiredInputs(fas.app)).toEqual([])
        })
      })
      describe(`for Counter component`, () => {
        it(`has no required inputs`, () => {
          expect(getRequiredInputs(fas.counterCmp1)).toEqual([])
        })
      })
      describe(`for Info component`, () => {
        it(`has two required inputs: "isLeftGreater" and "isRightGreater"`, () => {
          expect(getRequiredInputs(fas.infoCmp)).toEqual(['isLeftGreater', 'isRightGreater'])
        })
      })
    })

  })


  describe(`getNamesOfOptionalInputs`, () => {

    const getOptionalInputs = (cfa: ComponentFactoryAnalyzer) => {
      return [...cfa.componentAnalyzer.getNamesOfOptionalInputs()]
    }

    describe(`in 01-hello-world`, () => {
      const fas = get01Factories()
      describe(`App component`, () => {
        it(`has no optional inputs`, () => {
          expect(getOptionalInputs(fas.app)).toEqual([])
        })
      })
    })

    describe(`in 02-counter`, () => {
      const fas = get02Factories()
      describe(`App component`, () => {
        it(`has no optional inputs`, () => {
          expect(getOptionalInputs(fas.app)).toEqual([])
        })
      })
      describe(`Counter component`, () => {
        it(`has no optional inputs`, () => {
          expect(getOptionalInputs(fas.counterCmp)).toEqual([])
        })
      })
    })

    describe(`in 03-toggler`, () => {
      const fas = get03Factories()
      describe(`App component`, () => {
        it(`has no optional inputs`, () => {
          expect(getOptionalInputs(fas.app)).toEqual([])
        })
      })
      describe(`Toggle`, () => {
        it(`has a optional input`, () => {
          expect(getOptionalInputs(fas.toggleCmp)).toEqual([])
        })
      })
    })

    describe(`in 04-comparator`, () => {
      const fas = get04Factories()
      describe(`for App component`, () => {
        it(`has no optional inputs`, () => {
          expect(getOptionalInputs(fas.app)).toEqual([])
        })
      })
      describe(`for Counter component`, () => {
        it(`has one optional input: "value"`, () => {
          expect(getOptionalInputs(fas.counterCmp1)).toEqual(['value'])
        })
      })
      describe(`for Info component`, () => {
        it(`has no required inputs`, () => {
          expect(getOptionalInputs(fas.infoCmp)).toEqual([])
        })
      })
    })

  })


  // describe(`...`, () => {
  //
  //   describe(`in 01-hello-world`, () => {
  //     const fas = get01Factories()
  //   })
  //
  //   describe(`in 02-counter`, () => {
  //     const fas = get02Factories()
  //   })
  //
  //   describe(`in 03-toggler`, () => {
  //     const fas = get03Factories()
  //   })
  //
  //   describe(`in 04-comparator`, () => {
  //     const fas = get04Factories()
  //   })
  //
  //   describe(`in 05-deep-ifs`, () => {
  //     const fas = get05Factories()
  //   })
  //
  // })


})
