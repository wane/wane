import 'mocha'
import { assert } from 'chai'
import { rule } from './decorators'
import { eps } from './eps'
import { Grammar } from './grammar'
import * as tags from 'common-tags'
import { eof } from './eof'
import { SlrTable, SlrGraph } from './slr-parser'


describe(`Grammar`, () => {

  describe(`A simple grammar for additive expressions`, () => {

    /**
     * S -> E
     * E -> i p E
     * E -> i
     */

    // region Grammar

    /**
     * id
     */
    class i {
      kind = 'i'
      static kind = 'i'
    }

    /**
     * +
     */
    class p {
      kind = 'p'
      static kind = 'p'
    }

    /**
     * Start
     */
    class S {
      @rule(() => [E])
      static accept_E (expression: E) {
        return new S(expression)
      }

      constructor (private expression: E) { }
    }

    /**
     * Expression
     */
    class E {
      @rule(() => [i])
      static accept_i (id: i) {
        return new E(id, null, null)
      }

      @rule(() => [i, p, E])
      static accept_ipE (id: i, plus: p, expression: E) {
        return new E(id, plus, expression)
      }

      constructor (private id: i,
                   private plus: p | null,
                   private expression: E | null) { }
    }

    // endregion Grammar

    const grammar = new Grammar(S)

    describe(`FIRST`, () => {
      it(`S => i`, () => {
        assert.sameMembers([...grammar.first(S)], [i] as any)
      })
      it(`E => i`, () => {
        assert.sameMembers([...grammar.first(E)], [i] as any)
      })
    })

    describe(`FOLLOW`, () => {
      it(`S => $`, () => {
        assert.sameMembers([...grammar.follow(S)], [eof] as any)
      })
      it(`E => $`, () => {
        assert.sameMembers([...grammar.follow(E)], [eof] as any)
      })
    })

    describe(`SLR Graph`, () => {
      let graph: SlrGraph
      beforeEach(() => {
        graph = new SlrGraph(grammar.getAugmentedGrammar())
      })

      it(`has 6 states`, () => {
        assert.lengthOf(graph.nodes, 6)
      })

      it(`has 6 edges`, () => {
        assert.lengthOf(graph.edges, 6)
      })

      it(`is correct`, () => {
        assert.equal(graph.toString(), tags.stripIndent`
          I0
          _ -> • S
          S -> • E
          E -> • i p E
          E -> • i
          
          I1 = goto(I0, S)
          _ -> S •
          
          I2 = goto(I0, E)
          S -> E •
          
          I3 = goto(I0, i)
          E -> i • p E
          E -> i •
          
          I4 = goto(I3, p)
          E -> i p • E
          E -> • i p E
          E -> • i
          
          I5 = goto(I4, E)
          E -> i p E •
          
          I3 = goto(I4, i)
        `)
      })
    })

    describe(`SLR Table`, () => {
      const table = new SlrTable(grammar)

      it(`should be correct`, () => {
        assert.equal(table.toString(), tags.stripIndent`        
          ┏━━━━━┯━━━━━┯━━━━━┯━━━━━┯━━━━━┯━━━━━┓
          ┃  #  │  i  │  p  │  $  │  S  │  E  ┃
          ┣━━━━━┷━━━━━┷━━━━━┷━━━━━┷━━━━━┷━━━━━┫
          ┃  0     s3                1     2  ┃
          ┃  1                acc             ┃
          ┃  2                 r1             ┃
          ┃  3           s4    r3             ┃
          ┃  4     s3                      5  ┃
          ┃  5                 r2             ┃
          ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
        `)
      })
    })

  })

  describe(`Session grammar (Parsing Techniques, 2nd Edition; page 242)`, () => {

    /**
     * S -> o S c S
     * S -> F Q
     * F -> ε
     * F -> A F
     * Q -> q s
     * A -> e s
     */

    // region Grammar

    /**
     * (
     */
    class o {
      kind = 'o'
      static kind = 'o'
    }

    /**
     * )
     */
    class c {
      kind = 'c'
      static kind = 'c'
    }

    /**
     * !
     */
    class e {
      kind = 'e'
      static kind = 'e'
    }

    /**
     * ?
     */
    class q {
      kind = 'q'
      static kind = 'q'
    }

    /**
     * string
     */
    class s {
      kind = 's'
      static kind = 's'
    }

    /**
     * Session
     */
    class S {
      kind = 'S'
      static kind = 'S'

      @rule(() => [F, Q])
      static acceptFactsAndQuestion (facts: F, question: Q) {
        return new S(facts, question, null, null)
      }

      @rule(() => [o, S, c, S])
      static acceptSessions (open: o, left: S, close: c, right: S) {
        return new S(null, null, left, right)
      }

      constructor (public facts: F | null,
                   public question: Q | null,
                   public sessionLeft: S | null,
                   public sessionRight: S | null) {
      }
    }

    /**
     * Facts
     */
    class F {
      kind = 'F'
      static kind = 'F'

      @rule(() => [A, F])
      static acceptFacts (fact: A, facts: F) {
        return new F(fact, facts)
      }

      @rule(() => [eps])
      static acceptEps () {
        return new F(null, null)
      }

      constructor (public fact: A | null,
                   public facts: F | null) {
      }
    }

    /**
     * Fact
     */
    class A {
      kind = 'A'
      static kind = 'A'

      @rule(() => [e, s])
      static accept (exclamationMarkToken: e, stringToken: s) {
        return new Q(exclamationMarkToken, stringToken)
      }

      constructor (public exclamationMarkToken: e,
                   public stringToken: s) { }
    }

    /**
     * Question
     */
    class Q {
      kind = 'Q'
      static kind = 'Q'

      @rule(() => [q, s])
      static accept (questionMarkToken: q, stringToken: s) {
        return new Q(questionMarkToken, stringToken)
      }

      constructor (public questionMarkToken: q,
                   public stringToken: s) { }
    }

    // endregion Grammar

    const grammar = new Grammar(S)

    it(`should load rules correctly`, () => {
      assert.equal(grammar.toString(), tags.stripIndent`
        S -> o S c S
        S -> F Q
        F -> ε
        F -> A F
        Q -> q s
        A -> e s
      `)
    })

    describe(`FIRST`, () => {

      it(`S => o q e`, () => {
        assert.sameMembers([...grammar.first(S)], [o, q, e] as any)
      })

      it(`F => ε e`, () => {
        assert.sameMembers([...grammar.first(F)], [eps, e] as any)
      })

      it(`A => e`, () => {
        assert.sameMembers([...grammar.first(A)], [e] as any)
      })

      it(`Q => q`, () => {
        assert.sameMembers([...grammar.first(Q)], [q] as any)
      })

    })

    describe(`FOLLOW`, () => {

      it(`S => $ )`, () => {
        assert.sameMembers([...grammar.follow(S)], [eof, c] as any)
      })

      it(`F => q`, () => {
        assert.sameMembers([...grammar.follow(F)], [q] as any)
      })

      it(`A => q e`, () => {
        assert.sameMembers([...grammar.follow(A)], [q, e] as any)
      })

      it(`Q => $ c`, () => {
        assert.sameMembers([...grammar.follow(Q)], [eof, c] as any)
      })

    })

    describe(`SLR Graph`, () => {
      let graph: SlrGraph
      beforeEach(() => {
        graph = new SlrGraph(grammar.getAugmentedGrammar())
      })

      it(`has 14 states`, () => {
        assert.lengthOf(graph.nodes, 14)
      })

      it(`has 23 edges`, () => {
        assert.lengthOf(graph.edges, 23)
      })

      it(`is correct`, () => {
        assert.equal(graph.toString(), tags.stripIndent`
          I0
          _ -> • S
          S -> • o S c S
          S -> • F Q
          F -> •
          F -> • A F
          A -> • e s
          
          I1 = goto(I0, S)
          _ -> S •
          
          I2 = goto(I0, o)
          S -> o • S c S
          S -> • o S c S
          S -> • F Q
          F -> •
          F -> • A F
          A -> • e s
          
          I3 = goto(I0, F)
          S -> F • Q
          Q -> • q s
          
          I4 = goto(I0, A)
          F -> A • F
          F -> •
          F -> • A F
          A -> • e s
          
          I5 = goto(I0, e)
          A -> e • s
          
          I6 = goto(I2, S)
          S -> o S • c S
          
          I2 = goto(I2, o)
          
          I3 = goto(I2, F)
          
          I4 = goto(I2, A)
          
          I5 = goto(I2, e)
          
          I7 = goto(I3, Q)
          S -> F Q •
          
          I8 = goto(I3, q)
          Q -> q • s
          
          I9 = goto(I4, F)
          F -> A F •
          
          I4 = goto(I4, A)
          
          I5 = goto(I4, e)
          
          I10 = goto(I5, s)
          A -> e s •
          
          I11 = goto(I6, c)
          S -> o S c • S
          S -> • o S c S
          S -> • F Q
          F -> •
          F -> • A F
          A -> • e s
          
          I12 = goto(I8, s)
          Q -> q s •
          
          I13 = goto(I11, S)
          S -> o S c S •
          
          I2 = goto(I11, o)
          
          I3 = goto(I11, F)
          
          I4 = goto(I11, A)
          
          I5 = goto(I11, e)
        `)
      })
    })

    describe(`SLR Table`, () => {
      let table: SlrTable
      beforeEach(() => {
        table = new SlrTable(grammar)
      })

      it(`should look as it should`, () => {
        assert.equal(table.toString(), tags.stripIndent`
          ┏━━━━━┯━━━━━┯━━━━━┯━━━━━┯━━━━━┯━━━━━┯━━━━━┯━━━━━┯━━━━━┯━━━━━┯━━━━━┓
          ┃  #  │  o  │  c  │  q  │  s  │  e  │  $  │  S  │  F  │  Q  │  A  ┃
          ┣━━━━━┷━━━━━┷━━━━━┷━━━━━┷━━━━━┷━━━━━┷━━━━━┷━━━━━┷━━━━━┷━━━━━┷━━━━━┫
          ┃  0     s2          r3          s5          1     3           4  ┃
          ┃  1                                  acc                         ┃
          ┃  2     s2          r3          s5          6     3           4  ┃
          ┃  3                 s8                                  7        ┃
          ┃  4                 r3          s5                9           4  ┃
          ┃  5                      s10                                     ┃
          ┃  6          s11                                                 ┃
          ┃  7           r2                      r2                         ┃
          ┃  8                      s12                                     ┃
          ┃  9                 r4                                           ┃
          ┃  10                r6          r6                               ┃
          ┃  11    s2          r3          s5          13    3           4  ┃
          ┃  12          r5                      r5                         ┃
          ┃  13          r1                      r1                         ┃
          ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ 
        `)
      })

    })

  })

})
