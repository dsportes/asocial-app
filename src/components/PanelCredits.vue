<template>
  <div class="q-pa-sm largeur40 maauto">

  <panel-deta v-if="!session.estComptable" :c="c" :total="aSt.compta.credits.total"
    class="q-ma-xs q-pa-xs bord1"/>

  <q-btn v-if="!session.estComptable" class="q-my-xs" dense color="primary" 
    icon="add" :label="$t('TKnv')" @click="nvtk"/>

  <div v-if="!session.estComptable" class="q-ma-xs q-pa-xs bord1">
    <div class="text-italic titre-md">{{$t('TKinc')}}</div>
    <div v-if="dhinc" class="row titre-sm">
      <span class="q-mr-sm">{{$t('TKverif', [dhcool(dhinc)])}}</span>
      <span>{{$t('TKnbt', nbinc, { count: nbinc })}}</span>
    </div>
    <q-btn class="q-my-xs" flat size="sm" dense color="primary" 
      icon="check" :label="$t('TKbtnv')" @click="rafraichirIncorp"/>
  </div>

  <q-separator color="orange" class="q-my-xs"/>

  <div class="row justify-center">
    <q-radio v-model="att" checked-icon="task_alt" unchecked-icon="panorama_fish_eye" 
      val="A" :label="$t('TKatt')" class="q-mr-lg"/>
    <q-radio v-model="att" checked-icon="task_alt" unchecked-icon="panorama_fish_eye" 
      val="T" :label="$t('tous')" />
  </div>

  <div v-if="session.estComptable" class="q-mt-sm row justify-center">
    <div class="row items-center">
      <span class="text-italic fs-md q-mr-md">{{$t('TKdeb')}}</span>
      <q-input class="lg2" dense v-model="deb" clearable counter maxlength="6">
        <template v-slot:hint>{{$t('TKdebh')}}</template>
      </q-input>
    </div>
  </div>

  <div class="titre-lg text-italic text-center q-mt-sm q-mb-md">
    {{$t('TK' + (session.estComptable ? '1' : '2') + att)}}
  </div>

  <div v-for="(tk, idx) in lstTk" :key="tk.ids">
    <apercu-ticket :tk="tk" :idx="idx"/>
  </div>

  <q-dialog v-model="nouveautk">
    <panel-dialtk :min="50" :init="0" titre="TKnv" @ok="generer"/>
  </q-dialog>

  </div>
</template>

<script>
import { ref, watch, onMounted } from 'vue'
import stores from '../stores/stores.mjs'
import ApercuTicket from '../components/ApercuTicket.vue'
import PanelDeta from '../components/PanelDeta.vue'
import PanelDialtk from '../components/PanelDialtk.vue'
import { dhcool, mon, dkli, genIdTk, l6ToI, idTkToL6, afficherDiag } from '../app/util.mjs'
import { PlusTicket, RafraichirTickets } from '../app/operations.mjs'
import { MD } from '../app/modele.mjs'
import { AMJ } from '../app/api.mjs'

export default ({
  name: 'PanelCredits',

  props: { },

  components: { ApercuTicket, PanelDeta, PanelDialtk },

  computed: {
  },

  data () {
    return {
    }
  },

  methods: {
    async nvtk () {
      if (!await this.session.editUrgence()) return
      this.mx = '0'
      this.ovnouveautk()
    },
    async generer ({m, ref}) {
      const [ax, mx, j] = AMJ.aaaammjj(AMJ.amjUtc())
      const ids = genIdTk(ax, mx)
      const tkx = idTkToL6(ids)
      MD.fD()
      await new PlusTicket().run(m, ref, ids)
      await afficherDiag(this.$t('TKrefp', [this.session.org, tkx]))
    }
  },

  setup () {
    const session = stores.session
    const aSt = stores.avatar
    const c = ref(session.estComptable ? null : aSt.compta.compteurs)
    const lstTk = ref([]) 
    const src = ref([]) 
    const att = ref('A')
    const deb = ref('')
    const dhinc = ref(0)
    const nbinc = ref(0)

    function filtre (l) {
      const r = []
      if (att.value === 'A' || deb.value !== '') { 
        const d = deb.value.toUpperCase()
        l.forEach(tk => { 
          const c1 = d ? idTkToL6(tk.ids).startsWith(d) : true
          const c2 = (att.value === 'A' && tk.dr === 0) || att.value !== 'A'
          if (c1 && c2) r.push(tk)
        })
        return r 
      }
      return l
    }

    function tri (l) {
      if (att.value === 'A') l.sort((a, b) => { return a.dg < b.dg ? -1 : (a.dg === b.dg ? 0 : 1) })
      else l.sort((a, b) => { return a.dg < b.dg ? -1 : (a.dg === b.dg ? 0 : -1) })
      return l
    }

    function load () {
      // src.value = test
      if (session.estComptable) {
        src.value = aSt.getTickets
      } else {
        src.value = aSt.compta.credits.tickets
      }
      lstTk.value = tri(filtre(src.value))
    }

    watch(() => att.value, (ap, av) => {
        lstTk.value = tri(filtre(src.value))
      }
    )

    watch(() => deb.value, (ap, av) => {
        lstTk.value = tri(filtre(src.value))
      }
    )
     
    if (session.estComptable) {
      aSt.$onAction(({ name, args, after }) => {
        after((result) => {
          if (name === 'setTicket' || name === 'delTicket'){
            load()
          }
        })
      })
    } else {
      aSt.$onAction(({ name, args, after }) => {
        after((result) => {
          if (name === 'setCompta'){
            load()
          }
        })
      })
    }

    async function rafraichirIncorp () {
      dhinc.value = Date.now()
      nbinc.value = await new RafraichirTickets().run()
      load()
    }

    onMounted(async () => {
      if (!session.estComptable) await rafraichirIncorp()
      else load()
    })

    const nouveautk = ref(false)
    function ovnouveautk () { MD.oD(nouveautk) }

    return {
      nouveautk, ovnouveautk, rafraichirIncorp, dhinc, nbinc,
      aSt, session, lstTk, att, deb, c,
      MD, mon, dhcool, dkli, AMJ
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bord1
  border: 1px solid $grey-5
  border-radius: 5px
.lg2
  width: 8rem
</style>
