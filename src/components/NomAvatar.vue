<template>
  <q-card-section class="q-pt-none shadow-8 fs-md">
    <div class="titre-lg">{{$t('NAph' + phase)}}</div>
    <div v-if="verif">
      <div class="text-warning">{{$t('NAw1')}}</div>
      <div>
        <span class="q-px-sm text-negative bg-yellow text-bold">{{interdits}}</span>
        <span class="q-ml-sm">{{$t('NAw2')}}</span>
      </div>
    </div>
    <q-input dense counter v-model="nom"
      :label="groupe ? $t('NAng') : (tribu ? $t('NAnt') : $t('NAna'))"
      :rules="[r1,r2]" maxlength="32"
      @keydown.enter.prevent="ok" type="text" :hint="$t('entree')">
      <template v-slot:append>
        <span :class="nom.length === 0 ? 'disabled' : ''"><q-icon name="cancel" class="cursor-pointer"  @click="nom=''"/></span>
      </template>
    </q-input>
    <div v-if="labelValider" class="row justify-between items-center no-wrap">
      <q-btn flat dense color="primary" icon="close" :label="$t('renoncer')" @click="ko" />
      <q-btn v-if="phase < 3" color="warning" glossy :label="labelValider" size="md" :icon-right="iconValider"
      :disable="r1(nom) !== true || r2(nom) !== true" @click="ok" />
    </div>
  </q-card-section>
</template>
<script>

export default {
  name: 'NomAvatar',
  props: {
    iconValider: String,
    verif: Boolean,
    groupe: Boolean,
    tribu: Boolean,
    labelValider: String
  },
  data () {
    return {
      phase: 0,
      nom: '',
      interdits: '< > : " / \\ | ? *'
    }
  },
  methods: {
    r2 (val) { return val.length < 4 || val.length > 20 ? this.$t('NAe1') : true },
    r1 (val) {
      // eslint-disable-next-line no-control-regex
      return /[<>:"/\\|?*\x00-\x1F]/.test(val) ? this.$t('NAe2') : true
    },
    ok () {
      if (this.phase < 2 || this.phase === 3) {
        this.vnom = this.nom
        if (this.verif) {
          this.phase = 2
          this.nom = ''
          // this.$emit('ok-nom', null)
        } else {
          this.phase = 3
          this.$emit('ok-nom', this.nom)
        }
      } else {
        if (this.nom === this.vnom) {
          this.phase = 3
          this.$emit('ok-nom', this.nom)
        } else {
          this.phase = 1
          // this.$emit('ok-nom', null)
        }
      }
    },
    ko () {
      this.raz()
      this.$emit('ok-nom', null)
    },
    raz () {
      this.nom = ''
      this.vnom = ''
      this.phase = 0
    }
  },

  setup () {
  }
}
</script>

<style lang="sass" scoped>
@import '../css/input.sass'
</style>
