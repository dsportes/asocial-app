<template>
  <div class="q-pa-sm full-width">
    <div v-for="(tk, idx) in lstTk" :key="tk.ids">
      <apercu-ticket :tk="tk" :idx="idx" />
    </div>
    <!--
    <div v-if="session.estComptable" class="largeur40 maauto">
      <div class="titre-lg text-italic">{{$t('PCRtkatt2')}}</div>

      <div class="row items-center full-width">
        <div class="col-4 fs-md text-italic text-right q-pr-md">{{$t('PCRc1')}}</div>
        <q-input class="col-2" dense v-model.number="tki"/>
        <div class="col-4 text-bold text-negative">{{diag}}</div>
      </div>
      
      <div class="row items-center full-width">
        <div class="col-4 fs-md text-italic text-right q-pr-md">{{$t('PCRc2')}}</div>
        <q-input class="col-2" dense v-model="m" mask="#,##" fill-mask="0" 
          suffix="€" clearable placeholder="3,50" reverse-fill-mask/>
        <div class="col-4 text-bold text-negative">{{diag2}}</div>
      </div>

      <div class="row items-center full-width">
        <div class="col-4 fs-md text-italic text-right q-pr-md">{{$t('PCRc3')}}</div>
        <q-input class="col-6" dense v-model="com" clearable />
      </div>

      <div v-if="dhe" class="row items-center full-width">
        <div class="col-4 fs-md text-italic text-right q-pr-md">{{$t('PCRc4')}}</div>
        <div v-if="dhe" class="col-6">{{dhcool(dhe)}}</div>
      </div>

      <div v-if="dhe" class="row items-center full-width">
        <div v-if="cr" class="col-4 fs-md text-italic text-right q-pr-md">{{$t('PCRc5')}}</div>
        <div v-else class="col-4 fs-md text-italic text-right q-pr-md">{{$t('PCRc5n')}}</div>
      </div>

      <div class="q-mt-sm row q-gutter-sm">
        <q-btn dense color="primary" icon="clear" :label="$t('raz')"
          @click="raz"/>
        <q-btn dense color="primary" icon="search" :label="$t('rechercher')"
          :disable="disrec" @click="chercher"/>
        <q-btn dense color="primary" icon="check" :label="$t('enreg')"
          :disable="disenreg" @click="enreg"/>
        <q-btn dense color="primary" icon="close" :label="$t('supprimer')"
          :disable="disenreg" @click="suppr"/>
      </div>
    </div>

    <div v-if="aSt.compta.estA" class="q-pa-xs">
      <div class="titre-lg text-italic q-my-md">{{$t('PCRtkatt')}}</div>

      <q-btn dense size="md" icon="add" color="primary" :label="$t('PCRgen')"
        @click="nvTicket"/>

      <div v-for="(tk, idx) in aSt.compta.credits.tickets" :key="tk"
        :class="dkli(idx) + 'q-my-xs row items-center'">
        <span class="font-mono q-mr-xs">{{session.org}}</span>
        <span class="font-mono q-mr-xs">{{(''+tk).substring(0, 8)}}</span>
        <span class="font-mono q-mr-xs">{{(''+tk).substring(8, 12)}}</span>
        <span class="font-mono q-mr-lg">{{(''+tk).substring(12, 12)}}</span>
        <q-btn dense size="sm" icon="close" color="negative" @click="del(tk)"/>
      </div>
    </div>
-->
  <q-dialog v-model="confirmdel">
    <q-card class="bs">
      <q-card-section class="q-pa-md fs-md text-center">
        {{$t('PCPdel')}}</q-card-section>
      <q-card-actions align="right">
        <q-btn flat :label="$t('renoncer')" color="primary" @click="MD.fD"/>
        <q-btn flat :label="$t('PCdel2')" color="warning" @click="deltk2"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  </div>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import ApercuTicket from '../components/ApercuTicket.vue'
import { dhcool, mon, dkli, genTk, l6ToI, $t, afficherDiag } from '../app/util.mjs'
import { GenererRefCredit, DeleteRefCredit } from '../app/operations.mjs'
import { MD } from '../app/modele.mjs'
import { cleOK } from '../app/api.mjs'

export default ({
  name: 'PanelCredits',

  props: { },

  components: { ApercuTicket },

  watch: {
    tki (ap, av) {
      this.diag = ''
      const l = (''+ap).length
      if (l !== 13) { this.diag = this.$t('PCRd1'); return }
      if (!cleOK(ap)) { this.diag = this.$t('PCRd2'); return }
    },
    m (ap) {
      this.diag2 = ''
      const x = parseInt(ap ? ap.replaceAll(',', '') : '0')
      if (x !== 0 && (x < 50 || x > 10000)) { this.diag2 = this.$t('PCRd3'); return }
    }
  },

  computed: {
    disrec () { 
      const x = this.tki === 0 || this.diag !== ''
      return x
    },
    disenreg () { 
      const x = this.disrec || this.m === '' || this.diag2 !== ''
      return x
    }
  },

  data () {
    return {
      tk: 0,
      tki: 0,
      diag: '',
      diag2: '',
      info: '',
      m: 0,
      com: '',
      dhe: 0,
      cr: false,
    }
  },

  methods: {
    /*
    raz () { this.tki = 0; this.com = '', this.m = '0', this.dhe = 0, this.cr = false },
    async enreg () {

    },
    async chercher () {

    },
    async suppr () {

    },
    async nvTicket () {
      if (!await this.session.editUrgence()) return
      this.tk = await new GenererRefCredit().run()
      await afficherDiag($t('PCRref'), [this.session.org, this.tk])
    },
    async del (tk) {
      if (!await this.session.editUrgence()) return
      this.tk = tk
      this.ovconfirmdel()
    },
    async deltk2 () {
      MD.fD()
      await new DeleteRefCredit().run(this.tk)
    }
    */
  },

  setup () {
    const session = stores.session
    const aSt = stores.avatar
    const compta = aSt.compta

    const lstTk = [
      { ids: l6ToI(genTk(2023, 9)), dg: 20230928, dr: 0, di: 0, ma: 350, mc: 0, refa: '', refc: '' },
      { ids: l6ToI(genTk(2023, 9)), dg: 20230927, dr: 20230928, di: 0, ma: 350, mc: 0, refa: '', refc: '' },
      { ids: l6ToI(genTk(2023, 9)), dg: 20230926, dr: 20230927, di: 20230927, ma: 350, mc: 0, refa: '', refc: '' },
      { ids: l6ToI(genTk(2023, 9)), dg: 20230927, dr: 20230928, di: 0, ma: 350, mc: 300, refa: '', refc: 'Erreur montant' },
      { ids: l6ToI(genTk(2023, 9)), dg: 20230927, dr: 20230928, di: 0, ma: 500, mc: 500, refa: 'Avoir: 43RX', refc: 'OK' },
    ]

    const confirmdel = ref(false)
    function ovconfirmdel () { MD.oD(confirmdel)}

    return {
      aSt, session, lstTk,
      confirmdel, ovconfirmdel,
      MD, mon, dhcool, dkli
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.wtk
  width: 8rem
.wm
  width: 5rem
.dec
  position: relative
  top: 5px
</style>
