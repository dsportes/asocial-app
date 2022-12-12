<template>
  <q-card v-if="source" class="inset-shadow inset-shadow-down">
    <q-bar class="fullwidth">
      <q-icon v-if="s.st===0" class="q-pa-xs" size="md" name="check" color="green-5"/>
      <q-icon v-if="s.st===1" class="q-pa-xs" size="md" name="notification_important" color="warning"/>
      <q-icon v-if="s.st===2" class="q-pa-xs" size="md" name="fullscreen_exit" color="warning"/>
      <q-icon v-if="s.st===3" class="q-pa-xs" size="md" name="edit_off" color="negative"/>
      <q-icon v-if="s.st===4" class="q-pa-xs" size="md" name="lock_outline" color="negative"/>
      <div class="titre-md">{{s.nom + ' : ' + $t('IB'+s.stn)}}</div>
      <q-space/>
      <q-btn dense color="primary" v-if="!lecture && s.ecr && !edmode" icon="edit" @click="editer"/>
      <q-btn v-if="!lecture && s.ecr && s.dh" dense color="negative" icon="delete" @click="supprimer"/>
      <q-btn dense v-if="close" color="warning" :disable="edmode" class="q-ml-md" icon="chevron_right" @click="fermer"/>
    </q-bar>
    <div v-if="s.st" class="q-pa-sm titre-lg text-italic">
      <span class="q-mr-md" v-if="lecture || !s.ecr">{{$t('EBLcs')}}</span>
      <span class="q-mr-md">{{$t('EBLcp') + ' : ' + (s.c ? $t('EBLlc') : $t('EBLup')) + '.'}}</span>
      <span v-if="s.dh">{{dhcool(s.dh)}}</span>
    </div>

    <div v-if="s.st">
      <q-card-section>
        <div>
          <div v-for="x in s.ljc" :key="x[0]" class="row">
            <div class="col-3">{{ed(x[0])}}</div>
            <div class="col-9"><span :class="x[1] === s.stn ? 'text-primary text-bold' : ''">{{$t('IB'+x[1])}}</span></div>
          </div>
        </div>
        <q-separator/>
        <q-select :class="'selw' + (edmode ? ' bord' : '')" emit-value map-options :readonly="lecture" v-model="s.st" :options="K.options"
          label="Raison majeure" stack-label dense options-dense />
        <show-html class="q-my-sm border" style="height:4rem;overflow:hidden" v-if="!edmode" zoom :texte="s.txtav" maxh="6rem"/>
        <editeur-md class="full-width height-8 q-my-sm" v-if="edmode" modetxt v-model="s.txt" :texte="s.txtav" editable />
        <div v-if="edmode" class="bord">
          <div class="titre-md text-italic">{{$t('EBLnbj')}}</div>
          <div class="row q-gutter-sm">
            <q-input class="inp" v-if="config.debug" dense v-model.number="s.jib" label="Jour initial" type="number"/>
            <q-input class="inp" dense v-model.number="s.jn1" :label="$t('EBLniv') + ' 1'" type="number" hint="0..300"/>
            <q-input class="inp" dense v-model.number="s.jn2" :label="$t('EBLniv') + ' 2'" type="number" hint="0..300"/>
            <q-input class="inp" dense v-model.number="s.jn3" :label="$t('EBLniv') + ' 3'" type="number" hint="0..300"/>
          </div>
          <q-separator/>
        </div>
        <q-card-actions>
          <q-btn v-if="edmode" dense color="secondary" icon="undo" size="md"
                :label="$t('annuler')" @click="undo"/>
          <q-btn v-if="edmode" dense color="warning" :disable="!s.modif" icon="check" size="md"
                :label="$t('valider')" @click="valider"/>
        </q-card-actions>
      </q-card-section>
    </div>
  </q-card>
</template>

<script>

import { toRef, reactive, watch } from 'vue'
import stores from '../stores/stores.mjs'
import EditeurMd from './EditeurMd.vue'
import ShowHtml from './ShowHtml.vue'
import { $t, dhcool } from '../app/util.mjs'
import { Tribu, compilNiv } from '../app/modele.mjs'
import { DateJour } from '../app/api.mjs'
import { EnregBlocage } from '../app/operations.mjs'

export default {
  name: 'EdBlocage',

  components: { EditeurMd, ShowHtml },

  props: { source: Object, lecture: Boolean, naTribu: Object, naCompte: Object, close: Function },

  computed: { },

  data () {
    return {
      dhcool: dhcool,
      edmode: false
    }
  },
  methods: {
    fermer () { if (this.close) this.close() },
    ed (nbj) {
      const d = new DateJour(nbj)
      return this.$t('jourc' + d.js) + ' ' + d.jjmmaaaa
    },
    editer () {
      if (!this.s.dh) this.reset(1, this.K.jconnx)
      this.edmode = true
    },
    undo () {
      if (this.s.dh) {
        this.init() // reprise de la source initiale
      } else {
        this.reset(0, 0) // ignorer la création en cours
      }
      this.edmode = false
    },
    async valider () {
      const x = this.s
      const datat = {
        st: x.st,
        c: x.c,
        txt: x.txt,
        jib: x.jib,
        lj: [x.jn1, x.jn2, x.jn3],
        dh: new Date().getTime()
      }
      await new EnregBlocage().run(x.id, this.naTribu.rnd, datat)
      this.edmode = false
    },
    supprimer () {
      this.$q.dialog({
        dark: true,
        title: 'Suppression du blocage',
        message: `Vous êtes sur le point de supprimer ce blocage et de revenir à 
        une situation normale, libre. <br>Le blocage est ...`,
        cancel: { label: 'Maintenu', flat: true, color: 'primary' },
        ok: { color: 'warning', flat: true, label: 'Supprimé' },
        persistent: true,
        html: true
      }).onOk(async () => {
        const x = this.s
        await new EnregBlocage().run(x.id)
        this.edmode = false
      }).onCancel(() => {
      }).onDismiss(() => {
      })
    }
  },

  setup (props) {
    /* Blocage d'un Tribu ou Compta
    - `st` : raison majeure du blocage : 0 à 9 repris dans la configuration de l'organisation.
    - `c`: 1 si positionné par le comptable (dans une tribu toujours 1)
    - `txt` : libellé explicatif du blocage.
    - `jib` : jour initial de la procédure de blocage
    - `lj` : `[j01 j12 j23 j34]` : nb de jours pour passage aux niveaux 2, 3, 4.
    - `dh` : date-heure de dernier changement du statut de blocage.
    */
    const config = stores.config
    const session = stores.session

    const source = toRef(props, 'source')
    const naCompte = toRef(props, 'naCompte')

    const K = {
      jconnx: session.dateJourConnx.nbj,
      ljb: [],
      lrb: [],
      options: []
    }

    function setConfig () {
      const c = config.raisonsblocage
      const lr = Object.keys(c)
      K.lrb = new Array(lr.length + 1)
      K.ljb = new Array(lr.length + 1)
      lr.sort()
      lr.forEach(x => {
        const value = parseInt(x.substring(0, 1))
        const label = $t('RBL' + value)
        K.options.push({ label, value })
        K.lrb[value] = label
        K.ljb[value] = c[x]
      })
    }

    setConfig()

    const vide = {
      orig: null, // objet blocage initial
      id: 0, // id de la source
      nom: '', // nom de la tribu ou du compte
      estTribu: false, // true si la source est un objet Tribu
      ljc: [], // liste des jours cumulés de changement de niveaux
      st: 0,
      stn: 0, // niveau courant de blocage (ou 0)
      c: 0,
      jib: 0,
      jn1: 0,
      jn2: 0,
      jn3: 0,
      txt: '',
      txtav: '',
      dh: 0,
      modif: false,
      ecr: false
    }

    function init () {
      const sv = source.value
      if (!sv) return
      s.id = sv.id
      s.estTribu = sv instanceof Tribu
      s.nom = s.estTribu ? sv.na.nom : naCompte.value.nom
      const x = sv.blocage
      if (x) {
        s.orig = x
        s.st = x.st
        s.c = x.c
        s.txt = x.txt
        s.txtav = x.txt
        s.jib = x.jib
        s.jn1 = x.lj[0]; s.jn2 = x.lj[1]; s.jn3 = x.lj[2]
        s.dh = x.dh
        s.modif = false
        s.ecr = session.estComptable || s.c === 0
        compljc()
      } else {
        s.orig = null
        reset(0, 0)
      }
    }

    function modif () {
      const av = s.orig
      s.modif = !av || s.st !== av.st || s.jib !== av.jib || s.c !== av.c || s.txt !== s.txtav ||
      s.jn1 !== av.lj[0] || s.jn2 !== av.lj[1] || s.jn3 !== av.lj[2]
    }

    function reset (raison, jib) {
      s.modif = raison || jib
      s.st = raison
      s.jib = jib
      s.c = session.estComptable ? 1 : 0
      s.ecr = true
      s.txt = ''
      s.txtav = ''
      s.dh = 0
      setjn(raison)
      compljc()
    }

    const s = reactive({ ...vide })

    function setjn (raison) {
      s.jn1 = raison ? K.ljb[raison][0] : 0
      s.jn2 = raison ? K.ljb[raison][1] : 0
      s.jn3 = raison ? K.ljb[raison][2] : 0
    }

    function compljc () {
      const [niv, ljc] = compilNiv(s.jib, [s.jn1, s.jn2, s.jn3])
      s.stn = niv
      s.ljc = ljc
    }

    watch(() => source.value, (ap, av) => {
      init(); compljc()
    })

    watch(() => s.st, (ap, av) => { setjn(ap); modif() })
    watch(() => s.c, (ap, av) => { modif() })
    watch(() => s.txt, (ap, av) => { modif() })
    watch(() => s.jib, (ap, av) => { compljc(); modif() })
    watch(() => s.jn1, (ap, av) => {
      if (ap < 0) setTimeout(() => { s.jn1 = 0 }, 0)
      if (ap > 300) setTimeout(() => { s.jn1 = 300 }, 0)
      compljc(); modif()
    })
    watch(() => s.jn2, (ap, av) => {
      if (ap < 0) setTimeout(() => { s.jn2 = 0 }, 0)
      if (ap > 300) setTimeout(() => { s.jn2 = 300 }, 0)
      compljc(); modif()
    })
    watch(() => s.jn3, (ap, av) => {
      if (ap < 0) setTimeout(() => { s.jn3 = 0 }, 0)
      if (ap > 300) setTimeout(() => { s.jn3 = 300 }, 0)
      compljc(); modif()
    })

    init()

    return {
      config,
      K,
      s,
      session,
      init,
      reset
    }
  }
}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.selw
  width: 10rem
.inp
  width: 4rem
.q-dialog__inner
  padding:  0 !important
.q-bar--standard
  padding: 0 !important
  height: 2.5rem !important
.bord
  border: 2px solid $warning
  border-radius: 3px
  padding: 3px
.border
  border: 1px solid $grey-5
  border-radius: 3px
</style>
